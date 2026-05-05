# 🛡️ Couche Batch — Détection de Menaces Cybersécurité

## Prérequis
- Docker Desktop installé et démarré (minimum 8GB RAM)
- Le fichier `cybersecurity_threat_detection_logs.csv`  
  → https://www.kaggle.com/datasets/aryan208/cybersecurity-threat-detection-logs

---

## Fichiers
```
├── docker-compose.yml      ← Lance tous les services
├── jobs/cyber_batch.py     ← Analyses Spark
└── hbase_commands.hbase    ← Données dans HBase
```

---

## Lancer le projet

### 1. Démarrer les services
```bash
docker compose up -d
```

### 2. Charger le CSV dans HDFS
```bash
docker exec namenode hdfs dfs -mkdir -p /logs/year=2023/month=10/day=15
docker cp cybersecurity_threat_detection_logs.csv namenode:/tmp/
docker exec namenode hdfs dfs -put /tmp/cybersecurity_threat_detection_logs.csv /logs/year=2023/month=10/day=15/
```

### 3. Créer les tables HBase
```bash
docker exec -it hbase hbase shell
```
```
create 'ip_reputation', 'cf_score', 'cf_stats'
create 'attack_patterns', 'cf_pattern', 'cf_meta'
create 'threat_timeline', 'cf_time', 'cf_volume'
exit
```

### 4. Lancer les analyses Spark
```bash
docker cp jobs/cyber_batch.py spark-master:/opt/spark-jobs/cyber_batch.py
docker exec spark-master /spark/bin/spark-submit --master spark://spark-master:7077 --driver-memory 1g --executor-memory 1g /opt/spark-jobs/cyber_batch.py
```

### 5. Insérer les résultats dans HBase
```bash
docker cp hbase_commands.hbase hbase:/tmp/hbase_commands.hbase
docker exec -it hbase hbase shell /tmp/hbase_commands.hbase
```

---

## Vérification
```bash
docker exec -it hbase hbase shell
scan 'ip_reputation'
scan 'attack_patterns'
scan 'threat_timeline'
```

---

## Pour l'API — Accès HBase REST
```
http://localhost:8085
```
Tables disponibles : `ip_reputation` · `attack_patterns` · `threat_timeline`
