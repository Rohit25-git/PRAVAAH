import networkx as nx
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.relationship import Relationship
from backend.app.models.case import Case

class NetworkService:
    def build_networkx_graph(self, db: Session, limit: int = 2500) -> nx.DiGraph:
        """Loads relationships from DB and builds directed NetworkX graph"""
        edges = db.query(Relationship).limit(limit).all()
        G = nx.DiGraph()

        for e in edges:
            G.add_node(e.source_entity_id, type=e.source_entity_type, label=e.source_entity_id)
            G.add_node(e.target_entity_id, type=e.target_entity_type, label=e.target_entity_id)
            G.add_edge(e.source_entity_id, e.target_entity_id, relationship=e.relationship_type, weight=e.weight or 1.0)

        return G

    def get_available_cases(self, db: Session, limit: int = 250) -> List[Dict[str, Any]]:
        """
        Returns list of active cases with connected entity counts for investigation dropdown,
        prioritizing cases linked to active predicted ATM cashout hotspots.
        """
        from backend.app.models.prediction import Prediction

        # Map hotspot predictions to their respective jurisdiction cases
        preds = db.query(Prediction).all()
        hotspot_map = {}
        for p in preds:
            c = db.query(Case).filter((Case.jurisdiction == p.state) | (Case.jurisdiction.ilike(f"%{p.state}%"))).first()
            if c and c.case_reference not in hotspot_map:
                hotspot_map[c.case_reference] = {
                    "loc_name": f"{p.district} ATM Corridor",
                    "risk_level": p.risk_level,
                    "risk_score": p.risk_score,
                    "zone_id": p.zone_id,
                    "district": p.district
                }

        results = (
            db.query(
                Relationship.source_entity_id,
                func.count(Relationship.id).label("entity_count")
            )
            .filter(Relationship.source_entity_type == "CASE")
            .group_by(Relationship.source_entity_id)
            .order_by(func.count(Relationship.id).desc())
            .all()
        )

        rel_counts = {r[0]: r[1] for r in results}

        # Build list: hotspot-associated cases first, then remaining cases
        hotspot_cases = []
        regular_cases = []
        seen = set()

        # 1. Hotspot cases
        for case_ref, h_info in hotspot_map.items():
            if case_ref in seen:
                continue
            seen.add(case_ref)
            c_meta = db.query(Case).filter(Case.case_reference == case_ref).first()
            category = c_meta.category if c_meta else "Financial Cyber Fraud Syndicate"
            jurisdiction = c_meta.jurisdiction if c_meta else "State Jurisdiction"
            priority = c_meta.priority if c_meta else "HIGH"
            count = rel_counts.get(case_ref, 7)

            hotspot_cases.append({
                "case_reference": case_ref,
                "label": f"{case_ref} — {jurisdiction} ({category}) [{h_info['loc_name']}]",
                "category": category,
                "jurisdiction": jurisdiction,
                "priority": priority,
                "risk_level": h_info["risk_level"],
                "risk_score": h_info["risk_score"],
                "zone_id": h_info["zone_id"],
                "district": h_info["district"],
                "connected_accounts_count": count,
                "hotspot_location": h_info["loc_name"]
            })

        # 2. Remaining cases
        for r in results:
            case_ref = r[0]
            if case_ref in seen:
                continue
            seen.add(case_ref)
            count = r[1]
            c_meta = db.query(Case).filter(Case.case_reference == case_ref).first()
            category = c_meta.category if c_meta else "Cyber Fraud Syndicate"
            jurisdiction = c_meta.jurisdiction if c_meta else "National Jurisdiction"
            priority = c_meta.priority if c_meta else "HIGH"
            r_level = "CRITICAL" if priority == "CRITICAL" else ("HIGH" if priority == "HIGH" else "MEDIUM")
            r_score = 88.0 if priority == "CRITICAL" else (72.0 if priority == "HIGH" else 45.0)

            regular_cases.append({
                "case_reference": case_ref,
                "label": f"{case_ref} — {jurisdiction} ({category})",
                "category": category,
                "jurisdiction": jurisdiction,
                "priority": priority,
                "risk_level": r_level,
                "risk_score": r_score,
                "connected_accounts_count": count,
            })
            if len(hotspot_cases) + len(regular_cases) >= limit:
                break

        return hotspot_cases + regular_cases

    def get_all_risks_network(
        self,
        db: Session,
        risk_level: Optional[str] = None,
        max_nodes: int = 120
    ) -> Dict[str, Any]:
        """
        Extracts a comprehensive pan-India multi-risk topological network correlating
        the predicted ATM risk hotspots with registered cases, money mule accounts,
        and cashout ATM terminals. Supports filtering by risk tier (CRITICAL, HIGH, MEDIUM, LOW, ALL).
        """
        from backend.app.models.prediction import Prediction

        # 1. Fetch predictions/hotspots, optionally filtered by risk_level
        query = db.query(Prediction).order_by(Prediction.risk_score.desc())
        if risk_level and risk_level.upper() != "ALL":
            query = query.filter(Prediction.risk_level == risk_level.upper())
        predictions = query.all()

        G = nx.DiGraph()
        hotspots_covered = []
        risk_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

        for p in predictions:
            risk_counts[p.risk_level] = risk_counts.get(p.risk_level, 0) + 1
            hotspots_covered.append({
                "zone_id": p.zone_id,
                "district": p.district,
                "state": p.state,
                "risk_score": p.risk_score,
                "risk_level": p.risk_level
            })

            # Map to matching jurisdiction case
            c = db.query(Case).filter(
                (Case.jurisdiction == p.state) | (Case.jurisdiction.ilike(f"%{p.state}%"))
            ).first()
            if not c:
                continue

            case_id = c.case_reference
            # Add Case node
            G.add_node(
                case_id,
                type="CASE",
                label=f"{case_id} ({p.district})",
                risk=p.risk_score,
                risk_level=p.risk_level,
                category=c.category,
                jurisdiction=c.jurisdiction,
                priority=c.priority,
                zone_id=p.zone_id,
                hotspot_location=f"{p.district} ATM Corridor",
                is_center=False
            )

            # Mule Accounts linked to this case
            c_edges = db.query(Relationship).filter(
                Relationship.source_entity_id == case_id,
                Relationship.source_entity_type == "CASE"
            ).limit(3).all()

            for ce in c_edges:
                acc_id = ce.target_entity_id
                acc_risk = round(max(20.0, p.risk_score * 0.92), 1)
                acc_level = "CRITICAL" if acc_risk >= 70 else ("HIGH" if acc_risk >= 50 else ("MEDIUM" if acc_risk >= 30 else "LOW"))

                G.add_node(
                    acc_id,
                    type="ACCOUNT",
                    label=acc_id,
                    risk=acc_risk,
                    risk_level=acc_level,
                    case_linked=case_id,
                    hotspot_location=f"{p.district} ATM Corridor"
                )
                G.add_edge(case_id, acc_id, relationship=ce.relationship_type, weight=ce.weight or 1.0)

                # ATM withdrawals / Phone links from this mule account
                sub_edges = db.query(Relationship).filter(
                    Relationship.source_entity_id == acc_id
                ).limit(2).all()

                for se in sub_edges:
                    tgt_id = se.target_entity_id
                    tgt_type = se.target_entity_type
                    tgt_risk = round(max(15.0, p.risk_score * 0.85), 1)
                    tgt_level = "CRITICAL" if tgt_risk >= 70 else ("HIGH" if tgt_risk >= 50 else ("MEDIUM" if tgt_risk >= 30 else "LOW"))

                    G.add_node(
                        tgt_id,
                        type=tgt_type,
                        label=tgt_id,
                        risk=tgt_risk,
                        risk_level=tgt_level,
                        case_linked=case_id,
                        hotspot_location=f"{p.district} ATM Corridor"
                    )
                    G.add_edge(acc_id, tgt_id, relationship=se.relationship_type, weight=se.weight or 1.0)

            # Cap graph growth if reaching max_nodes
            if len(G.nodes()) >= max_nodes:
                break

        # Also add cross-account transfers if any exist between nodes in G
        node_set = set(G.nodes())
        if len(node_set) > 1:
            cross_edges = db.query(Relationship).filter(
                Relationship.source_entity_id.in_(list(node_set)[:40]),
                Relationship.target_entity_id.in_(list(node_set)[:40])
            ).limit(20).all()
            for x in cross_edges:
                if not G.has_edge(x.source_entity_id, x.target_entity_id):
                    G.add_edge(x.source_entity_id, x.target_entity_id, relationship=x.relationship_type, weight=x.weight or 1.0)

        pagerank = nx.pagerank(G, weight="weight") if len(G) > 1 else {n: 1.0 for n in G.nodes()}
        degrees = dict(G.degree())
        betweenness = nx.betweenness_centrality(G) if len(G) > 1 else {n: 0.0 for n in G.nodes()}

        nodes = []
        for node_id, data in G.nodes(data=True):
            pr = round(pagerank.get(node_id, 0.0) * 100, 2)
            deg = degrees.get(node_id, 0)
            bt = round(betweenness.get(node_id, 0.0) * 100, 2)
            risk_val = data.get("risk", 50.0)
            risk_lvl = data.get("risk_level", "MEDIUM")

            nodes.append({
                "data": {
                    "id": str(node_id),
                    "label": data.get("label", str(node_id)),
                    "type": data.get("type", "UNKNOWN"),
                    "risk": risk_val,
                    "risk_level": risk_lvl,
                    "is_center": data.get("is_center", False),
                    "category": data.get("category"),
                    "jurisdiction": data.get("jurisdiction"),
                    "priority": data.get("priority"),
                    "zone_id": data.get("zone_id"),
                    "hotspot_location": data.get("hotspot_location"),
                    "details": {
                        "pagerank": round(pagerank.get(node_id, 0.0), 4),
                        "degree": deg,
                        "betweenness": bt,
                        "case_linked": data.get("case_linked", str(node_id) if data.get("type") == "CASE" else None)
                    }
                }
            })

        edges = []
        edge_id = 0
        for u, v, data in G.edges(data=True):
            edge_id += 1
            edges.append({
                "data": {
                    "id": f"e{edge_id}",
                    "source": str(u),
                    "target": str(v),
                    "relationship": data.get("relationship", "CONNECTED_TO"),
                    "weight": data.get("weight", 1.0)
                }
            })

        top_entities = sorted(nodes, key=lambda n: n["data"]["details"]["degree"], reverse=True)[:10]
        summary = [{
            "entity": n["data"]["label"],
            "id": n["data"]["id"],
            "type": n["data"]["type"],
            "page_rank": n["data"]["details"]["pagerank"],
            "connections": n["data"]["details"]["degree"],
            "risk": n["data"]["risk_level"]
        } for n in top_entities]

        return {
            "elements": {"nodes": nodes, "edges": edges},
            "nodes": nodes,
            "edges": edges,
            "metrics": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "top_entities": summary,
                "risk_counts": risk_counts,
                "hotspots_count": len(hotspots_covered),
                "active_filter": risk_level or "ALL"
            }
        }

    def get_case_subgraph(self, db: Session, case_id: str) -> Dict[str, Any]:
        """
        Extracts a clean, dedicated case-wise ego network:
        Case -> Direct Mule Accounts -> Associated Cashout ATMs & Phones.
        Keeps the network crisp (15-30 nodes) to prevent clustering.
        """
        case_meta = db.query(Case).filter(Case.case_reference == case_id).first()
        category = case_meta.category if case_meta else "Cyber Fraud Syndicate"
        jurisdiction = case_meta.jurisdiction if case_meta else "India"
        priority = case_meta.priority if case_meta else "HIGH"

        # 1. Direct connections from Case to Mule Accounts
        c_edges = db.query(Relationship).filter(
            Relationship.source_entity_id == case_id,
            Relationship.source_entity_type == "CASE"
        ).all()

        mule_accounts = [e.target_entity_id for e in c_edges]

        # 2. Sub-edges from primary mule accounts (ATM withdrawals, phone links, transfers)
        sub_edges = []
        if mule_accounts:
            sub_edges = db.query(Relationship).filter(
                Relationship.source_entity_id.in_(mule_accounts[:6])
            ).limit(25).all()

        G = nx.DiGraph()
        # Add primary Case node
        G.add_node(
            case_id,
            type="CASE",
            label=f"{case_id}",
            is_case_center=True,
            category=category,
            jurisdiction=jurisdiction,
            priority=priority
        )

        for ce in c_edges[:6]:
            G.add_node(ce.target_entity_id, type=ce.target_entity_type, label=ce.target_entity_id)
            G.add_edge(case_id, ce.target_entity_id, relationship=ce.relationship_type, weight=ce.weight or 1.0)

        for se in sub_edges:
            G.add_node(se.source_entity_id, type=se.source_entity_type, label=se.source_entity_id)
            G.add_node(se.target_entity_id, type=se.target_entity_type, label=se.target_entity_id)
            G.add_edge(se.source_entity_id, se.target_entity_id, relationship=se.relationship_type, weight=se.weight or 1.0)

        pagerank = nx.pagerank(G, weight="weight") if len(G) > 1 else {n: 1.0 for n in G.nodes()}
        degrees = dict(G.degree())
        betweenness = nx.betweenness_centrality(G) if len(G) > 1 else {n: 0.0 for n in G.nodes()}

        nodes = []
        for node_id, data in G.nodes(data=True):
            pr = round(pagerank.get(node_id, 0.0) * 100, 2)
            deg = degrees.get(node_id, 0)
            bt = round(betweenness.get(node_id, 0.0) * 100, 2)

            ntype = data.get("type", "UNKNOWN")
            if ntype == "CASE":
                risk_val = 95.0 if priority == "CRITICAL" else (82.0 if priority == "HIGH" else 65.0)
            else:
                risk_val = min(100.0, round(pr * 6.0 + deg * 5.0 + 35.0, 1))

            risk_level = "CRITICAL" if risk_val >= 70 else ("HIGH" if risk_val >= 50 else ("MEDIUM" if risk_val >= 30 else "LOW"))

            nodes.append({
                "data": {
                    "id": str(node_id),
                    "label": data.get("label", str(node_id)),
                    "type": ntype,
                    "risk": risk_val,
                    "risk_level": risk_level,
                    "is_center": data.get("is_case_center", False),
                    "category": data.get("category"),
                    "jurisdiction": data.get("jurisdiction"),
                    "details": {
                        "pagerank": round(pagerank.get(node_id, 0.0), 4),
                        "degree": deg,
                        "betweenness": bt,
                        "case_linked": case_id
                    }
                }
            })

        edges = []
        edge_id = 0
        for u, v, data in G.edges(data=True):
            edge_id += 1
            edges.append({
                "data": {
                    "id": f"e{edge_id}",
                    "source": str(u),
                    "target": str(v),
                    "relationship": data.get("relationship", "CONNECTED_TO"),
                    "weight": data.get("weight", 1.0)
                }
            })

        top_entities = sorted(nodes, key=lambda n: n["data"]["details"]["degree"], reverse=True)[:10]
        summary = [{
            "entity": n["data"]["label"],
            "id": n["data"]["id"],
            "type": n["data"]["type"],
            "page_rank": n["data"]["details"]["pagerank"],
            "connections": n["data"]["details"]["degree"],
            "risk": n["data"]["risk_level"]
        } for n in top_entities]

        return {
            "elements": {"nodes": nodes, "edges": edges},
            "nodes": nodes,
            "edges": edges,
            "case_id": case_id,
            "metrics": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "top_entities": summary,
                "case_category": category,
                "jurisdiction": jurisdiction,
                "priority": priority
            }
        }

    def get_cytoscape_network(
        self,
        db: Session,
        case_id: Optional[str] = None,
        focus_entity_id: Optional[str] = None,
        max_nodes: int = 120
    ) -> Dict[str, Any]:
        """
        Extracts subgraph and returns Cytoscape elements with PageRank and degree metrics.
        Defaults to Case-Wise investigation when no specific target is given.
        """
        # If case_id is explicitly passed, use dedicated clean case subgraph
        if case_id and case_id != "ALL":
            return self.get_case_subgraph(db, case_id)

        # If focus_entity_id is a case reference, route to case subgraph
        if focus_entity_id and focus_entity_id.upper().startswith("CASE-"):
            return self.get_case_subgraph(db, focus_entity_id.upper())

        # If neither is provided and not explicitly ALL, default to top case
        if not focus_entity_id or focus_entity_id == "":
            top_case = (
                db.query(Relationship.source_entity_id)
                .filter(Relationship.source_entity_type == "CASE")
                .group_by(Relationship.source_entity_id)
                .order_by(func.count(Relationship.id).desc())
                .first()
            )
            if top_case and top_case[0]:
                return self.get_case_subgraph(db, top_case[0])

        G = self.build_networkx_graph(db, limit=2500)

        if len(G) == 0:
            return {
                "elements": {"nodes": [], "edges": []},
                "nodes": [],
                "edges": [],
                "metrics": {"total_nodes": 0, "total_edges": 0, "top_entities": []}
            }

        matched_target = None
        if focus_entity_id and focus_entity_id != "ALL":
            if focus_entity_id in G:
                matched_target = focus_entity_id
            else:
                f_lower = focus_entity_id.lower()
                for n in G.nodes():
                    if f_lower in str(n).lower():
                        matched_target = n
                        break

        if matched_target:
            subgraph_nodes = set([matched_target])
            subgraph_nodes.update(G.neighbors(matched_target))
            subgraph_nodes.update(G.predecessors(matched_target))
            for n in list(subgraph_nodes):
                subgraph_nodes.update(list(G.neighbors(n))[:4])
                subgraph_nodes.update(list(G.predecessors(n))[:4])
            H = G.subgraph(subgraph_nodes)
        else:
            degrees = dict(G.degree())
            sorted_nodes = sorted(degrees.items(), key=lambda x: x[1], reverse=True)
            selected = set()
            for n, d in sorted_nodes:
                if len(selected) >= max_nodes:
                    break
                selected.add(n)
                for neighbor in list(G.neighbors(n))[:3]:
                    if len(selected) < max_nodes:
                        selected.add(neighbor)
            H = G.subgraph(selected)

        pagerank = nx.pagerank(H, weight="weight") if len(H) > 1 else {n: 1.0 for n in H.nodes()}
        degrees = dict(H.degree())
        betweenness = nx.betweenness_centrality(H) if len(H) > 1 else {n: 0.0 for n in H.nodes()}

        nodes = []
        for node_id, data in H.nodes(data=True):
            pr = round(pagerank.get(node_id, 0.0) * 100, 2)
            deg = degrees.get(node_id, 0)
            bt = round(betweenness.get(node_id, 0.0) * 100, 2)
            
            risk_val = min(100.0, round(pr * 5.0 + deg * 4.0, 1))
            risk_level = "CRITICAL" if risk_val >= 70 else ("HIGH" if risk_val >= 50 else ("MEDIUM" if risk_val >= 30 else "LOW"))

            nodes.append({
                "data": {
                    "id": str(node_id),
                    "label": data.get("label", str(node_id)),
                    "type": data.get("type", "UNKNOWN"),
                    "risk": risk_val,
                    "risk_level": risk_level,
                    "details": {
                        "pagerank": round(pagerank.get(node_id, 0.0), 4),
                        "degree": deg,
                        "betweenness": bt
                    }
                }
            })

        edges = []
        edge_id = 0
        for u, v, data in H.edges(data=True):
            edge_id += 1
            edges.append({
                "data": {
                    "id": f"e{edge_id}",
                    "source": str(u),
                    "target": str(v),
                    "relationship": data.get("relationship", "CONNECTED_TO"),
                    "weight": data.get("weight", 1.0)
                }
            })

        top_entities = sorted(nodes, key=lambda n: n["data"]["details"]["degree"], reverse=True)[:10]
        summary = [{
            "entity": n["data"]["label"],
            "id": n["data"]["id"],
            "type": n["data"]["type"],
            "page_rank": n["data"]["details"]["pagerank"],
            "connections": n["data"]["details"]["degree"],
            "risk": n["data"]["risk_level"]
        } for n in top_entities]

        return {
            "elements": {"nodes": nodes, "edges": edges},
            "nodes": nodes,
            "edges": edges,
            "metrics": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "top_entities": summary
            }
        }

network_service = NetworkService()
