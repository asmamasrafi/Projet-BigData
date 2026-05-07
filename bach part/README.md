# 🛡️ Cybersecurity Batch Analysis — Maven/Spark/HBase

Couche Batch du système de détection de menaces cybersécurité (Architecture Lambda).

## Prérequis
- Docker Desktop (minimum 8GB RAM allouée)
- Java 8 + Maven 3
- Dataset : `cybersecurity_threat_detection_logs.csv`
  → https://www.kaggle.com/datasets/aryan208/cybersecurity-threat-detection-logs

---

## Structure du projet
```
├── pom.xml
├── src/main/java/
│   ├── BatchMain.java            ← Point d'entrée principal
│   ├── BatchAnalysis.java        ← Top 10 IPs malveillantes
│   ├── PortScanDetection.java    ← Détection scans de ports
│   ├── AttackPathAnalysis.java   ← Patterns SQLi/XSS/PathTraversal
│   ├── AttackVolumeAnalysis.java ← Volume par type de menace
│   └── HBaseWriter.java          ← Écriture dans HBase
└── README.md
```

---

## Lancer le projet

### 1. Démarrer l'environnement Docker
```bash
docker compose up -d
docker compose ps
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

### 4. Builder le projet
```bash
mvn clean package
```

### 5. Copier le JAR dans Spark
```bash
docker cp target/cybersecurity-batch-1.0-SNAPSHOT.jar spark-master:/opt/spark-jobs/cybersecurity-batch.jar
```

### 6. Lancer le job
```bash
docker exec spark-master /spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  --driver-memory 1g \
  --executor-memory 1g \
  --class BatchMain \
  /opt/spark-jobs/cybersecurity-batch.jar
```

### 7. Vérifier HBase
```bash
docker exec -it hbase hbase shell
scan 'ip_reputation'
scan 'attack_patterns'
scan 'threat_timeline'
```

---

## Résultats

| Analyse | Résultat |
|---------|----------|
| Top 10 IPs malveillantes | IP 221.93.148.50 — score 128.58 |
| Scans de ports TCP | 192.168.1.76 — 30 destinations en 5 min |
| Patterns d'attaques | 162,422 PathTraversal + 40,873 SQLi |
| Volume par menace | DDOS 49GB · BruteForce 7.8GB |

## Tables HBase

| Table | Row Key | Contenu |
|-------|---------|---------|
| `ip_reputation` | source_ip | Score réputation, stats connexions |
| `attack_patterns` | attack_type#source_ip | Patterns, occurrences, exemples |
| `threat_timeline` | date#heure#threat_label | Volume temporel des menaces |

## Pour l'API REST
```
HBase REST API : http://localhost:8085
Exemple : GET http://localhost:8085/ip_reputation/221.93.148.50
```
