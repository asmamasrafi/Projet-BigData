// hadi bax thzi dak fichier t7tih f continer

hdfs dfs -mkdir -p /logs/year=2023/month=10/day=15/
docker cp cybersecurity_threat_detection_logs.csv namenode:/tmp/

//daroori diri 
mvn clean project

//moraha rathzi dak jar li tkrya lik f dossier target
docker cp target/batch-analysis-1.0-SNAPSHOT.jar namenode:/opt/

//mohim ana 3ndi spark f namenod xofi wax tanti wla 3ndk f hadoop-master
docker exec -it namenode bash

//hadi bax t executi dok les fichier 
!!! hada /opt/spark/bin/spark-submit i9dr itbdl 3la 7sab fin 3ndk dak spark-submit

/1) Top 10 des IPs sources malveillantes (menaces suspicious + malicious)

/opt/spark/bin/spark-submit   --class BatchAnalysis   --master local[*]   /opt/batch-analysis-1.0-SNAPSHOT.jar

/2 Détection de scans de ports : plusieurs connexions TCP vers des ports différents depuis la
/opt/spark/bin/spark-submit   --class PortScanDetection   --master local[*]   /opt/batch-analysis-1.0-SNAPSHOT.jar

/3 Analyse des chemins d'attaque : extraction de patterns SQLi/XSS dans request_path
/opt/spark/bin/spark-submit   --class AttackPathAnalysis   --master local[*]   /opt/batch-analysis-1.0-SNAPSHOT.jar

/4 Volume de données transférées par type de menace (corrélation bytes_transferred ↔threat_label)
/opt/spark/bin/spark-submit   --class AttackVolumeAnalysis   --master local[*]   /opt/batch-analysis-1.0-SNAPSHOT.jar


