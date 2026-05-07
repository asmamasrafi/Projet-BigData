import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

/**
 * Analyse 2 — Détection de scans de ports TCP
 * Détecte les IPs qui contactent plus de 5 dest_ip distincts
 * dans une fenêtre de 5 minutes
 */
public class PortScanDetection {

    public static void run(SparkSession spark, String hdfsPath) {

        System.out.println("===== ANALYSE 2 : DÉTECTION SCANS DE PORTS =====");

        // 1. Lire le dataset
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv(hdfsPath);

        // 2. Parser le timestamp
        Dataset<Row> parsed = df.withColumn(
                "timestamp",
                to_timestamp(col("timestamp"))
        ).filter(col("timestamp").isNotNull());

        // 3. Filtrer TCP uniquement
        Dataset<Row> tcp = parsed.filter(
                col("protocol").equalTo("TCP")
        );

        // 4. Fenêtre 5 minutes + count distinct dest_ip
        Dataset<Row> grouped = tcp.groupBy(
                col("source_ip"),
                window(col("timestamp"), "5 minutes")
        ).agg(
                countDistinct("dest_ip").alias("unique_dest_ips"),
                count("*").alias("nb_tentatives"),
                min("timestamp").alias("premiere_tentative"),
                max("timestamp").alias("derniere_tentative")
        );

        // 5. Détecter les scans (> 5 destinations distinctes)
        Dataset<Row> scans = grouped
                .filter(col("unique_dest_ips").gt(5))
                .orderBy(desc("unique_dest_ips"));

        // 6. Affichage
        System.out.println("\n📊 IPs suspectes de scan de ports :");
        scans.select(
                col("source_ip"),
                col("window"),
                col("unique_dest_ips"),
                col("nb_tentatives"),
                col("premiere_tentative"),
                col("derniere_tentative")
        ).show(20, false);

        // 7. Sauvegarde HDFS
        scans.write()
                .mode(SaveMode.Overwrite)
                .parquet("hdfs://namenode:9000/batch_results/port_scans");

        System.out.println("✅ Résultats sauvegardés → hdfs:///batch_results/port_scans");
    }
}
