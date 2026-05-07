import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

/**
 * Analyse 1 — Top 10 des IPs sources malveillantes
 * Filtre : threat_label IN (suspicious, malicious)
 * Score de réputation = (malicious*2 + suspicious*1) / total * 100
 */
public class BatchAnalysis {

    public static void run(SparkSession spark, String hdfsPath) {

        System.out.println("===== ANALYSE 1 : TOP 10 IPs MALVEILLANTES =====");

        // 1. Lire le dataset
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv(hdfsPath);

        // 2. Filtrer suspicious + malicious
        Dataset<Row> filtered = df.filter(
                col("threat_label").isin("suspicious", "malicious")
        );

        // 3. Calculer les métriques par IP
        Dataset<Row> ipStats = filtered.groupBy("source_ip")
                .agg(
                        count("*").alias("nb_connexions"),
                        sum(when(col("threat_label").equalTo("malicious"), 1).otherwise(0))
                                .alias("nb_malicious"),
                        sum(when(col("threat_label").equalTo("suspicious"), 1).otherwise(0))
                                .alias("nb_suspicious"),
                        sum("bytes_transferred").alias("total_bytes"),
                        countDistinct("dest_ip").alias("nb_cibles")
                );

        // 4. Calculer le score de réputation
        Dataset<Row> top10 = ipStats
                .withColumn("reputation_score",
                        round(
                            col("nb_malicious").multiply(2.0)
                            .plus(col("nb_suspicious").multiply(1.0))
                            .divide(col("nb_connexions"))
                            .multiply(100),
                        2)
                )
                .orderBy(desc("reputation_score"))
                .limit(10);

        // 5. Affichage
        System.out.println("\n📊 Top 10 IPs les plus dangereuses :");
        top10.select(
                col("source_ip"),
                col("reputation_score"),
                col("nb_malicious"),
                col("nb_suspicious"),
                col("nb_connexions"),
                col("nb_cibles"),
                col("total_bytes")
        ).show(false);

        // 6. Sauvegarde HDFS pour HBase
        top10.write()
                .mode(SaveMode.Overwrite)
                .parquet("hdfs://namenode:9000/batch_results/ip_reputation");

        System.out.println("✅ Résultats sauvegardés → hdfs:///batch_results/ip_reputation");
    }
}
