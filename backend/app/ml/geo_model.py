import numpy as np
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any, Tuple

class SpatialClusterEngine:
    def __init__(self, eps_km: float = 2.5, min_samples: int = 4):
        self.kms_per_radian = 6371.0088
        self.eps_rad = eps_km / self.kms_per_radian
        self.min_samples = min_samples

    def cluster_points(self, coords: List[Tuple[float, float]]) -> List[Dict[str, Any]]:
        """
        Runs DBSCAN clustering with Haversine metric on (latitude, longitude) coordinates.
        Returns cluster IDs, centers, and event counts.
        """
        if len(coords) < self.min_samples:
            return []

        coords_arr = np.array(coords)
        coords_rad = np.radians(coords_arr)

        db = DBSCAN(eps=self.eps_rad, min_samples=self.min_samples, metric="haversine")
        labels = db.fit_predict(coords_rad)

        clusters = []
        for label in set(labels):
            if label == -1:
                continue
            mask = (labels == label)
            pts = coords_arr[mask]
            center_lat = float(np.mean(pts[:, 0]))
            center_lon = float(np.mean(pts[:, 1]))
            count = int(np.sum(mask))

            clusters.append({
                "cluster_id": int(label),
                "center_lat": round(center_lat, 6),
                "center_lon": round(center_lon, 6),
                "count": count
            })

        return clusters

spatial_cluster_engine = SpatialClusterEngine()
