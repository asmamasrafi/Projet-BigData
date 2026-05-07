import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.ConnectionFactory;
import org.apache.hadoop.hbase.client.Put;
import org.apache.hadoop.hbase.client.Table;
import org.apache.hadoop.hbase.util.Bytes;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.SparkSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * HBaseWriter — Écrit les résultats Spark dans les 3 tables HBase
 * Tables : ip_reputation, attack_patterns, threat_timeline
 */
public class HBaseWriter {

    public static void run(SparkSession spark, String hbaseHost, String zkPort)
            throws IOException {

        System.out.println("===== ÉCRITURE DANS HBASE =====");

        Configuration hbaseConf = HBaseConfiguration.create();
        hbaseConf.set("hbase.zookeeper.quorum", hbaseHost);
        hbaseConf.set("hbase.zookeeper.property.clientPort", zkPort);
        hbaseConf.set("zookeeper.znode.parent", "/hbase");

        try (Connection connection = ConnectionFactory.createConnection(hbaseConf)) {
            writeIpReputation(spark, connection);
            writeAttackPatterns(spark, connection);
            writeThreatTimeline(spark, connection);
        }

        System.out.println("\n✅ Écriture HBase terminée !");
    }

    // ════════════════════════════════════════════════════════
    // TABLE 1 — ip_reputation
    // ════════════════════════════════════════════════════════
    private static void writeIpReputation(SparkSession spark, Connection connection)
            throws IOException {

        System.out.println("\n[HBase] Écriture → ip_reputation");

        Dataset<org.apache.spark.sql.Row> df = spark.read()
                .parquet("hdfs://namenode:9000/batch_results/ip_reputation");

        Table table = connection.getTable(TableName.valueOf("ip_reputation"));
        List<Put> puts = new ArrayList<>();

        for (org.apache.spark.sql.Row row : df.collectAsList()) {
            String ip = row.getAs("source_ip").toString();
            Put put = new Put(Bytes.toBytes(ip));

            put.addColumn(Bytes.toBytes("cf_score"), Bytes.toBytes("reputation_score"),
                    Bytes.toBytes(row.getAs("reputation_score").toString()));
            put.addColumn(Bytes.toBytes("cf_score"), Bytes.toBytes("nb_malicious"),
                    Bytes.toBytes(row.getAs("nb_malicious").toString()));
            put.addColumn(Bytes.toBytes("cf_score"), Bytes.toBytes("nb_suspicious"),
                    Bytes.toBytes(row.getAs("nb_suspicious").toString()));
            put.addColumn(Bytes.toBytes("cf_stats"), Bytes.toBytes("nb_connexions"),
                    Bytes.toBytes(row.getAs("nb_connexions").toString()));
            put.addColumn(Bytes.toBytes("cf_stats"), Bytes.toBytes("total_bytes"),
                    Bytes.toBytes(row.getAs("total_bytes").toString()));
            put.addColumn(Bytes.toBytes("cf_stats"), Bytes.toBytes("nb_cibles"),
                    Bytes.toBytes(row.getAs("nb_cibles").toString()));

            puts.add(put);
            System.out.println("  ✅ IP insérée : " + ip);
        }

        table.put(puts);
        table.close();
        System.out.println("  📊 " + puts.size() + " IPs insérées dans ip_reputation");
    }

    // ════════════════════════════════════════════════════════
    // TABLE 2 — attack_patterns
    // ════════════════════════════════════════════════════════
    private static void writeAttackPatterns(SparkSession spark, Connection connection)
            throws IOException {

        System.out.println("\n[HBase] Écriture → attack_patterns");

        Dataset<org.apache.spark.sql.Row> df = spark.read()
                .parquet("hdfs://namenode:9000/batch_results/attack_patterns")
                ;

        Table table = connection.getTable(TableName.valueOf("attack_patterns"));
        List<Put> puts = new ArrayList<>();

        for (org.apache.spark.sql.Row row : df.collectAsList()) {
            String attackType = row.getAs("attack_type").toString();
            String sourceIp   = row.getAs("source_ip").toString();
            String rowKey     = attackType + "#" + sourceIp;

            Put put = new Put(Bytes.toBytes(rowKey));

            put.addColumn(Bytes.toBytes("cf_pattern"), Bytes.toBytes("attack_type"),
                    Bytes.toBytes(attackType));
            put.addColumn(Bytes.toBytes("cf_pattern"), Bytes.toBytes("nb_occurrences"),
                    Bytes.toBytes(row.getAs("nb_occurrences").toString()));
            put.addColumn(Bytes.toBytes("cf_pattern"), Bytes.toBytes("exemple_path"),
                    Bytes.toBytes(row.getAs("exemple_path") != null
                            ? row.getAs("exemple_path").toString() : ""));
            put.addColumn(Bytes.toBytes("cf_meta"), Bytes.toBytes("source_ip"),
                    Bytes.toBytes(sourceIp));
            put.addColumn(Bytes.toBytes("cf_meta"), Bytes.toBytes("premiere_attaque"),
                    Bytes.toBytes(row.getAs("premiere_attaque") != null
                            ? row.getAs("premiere_attaque").toString() : ""));
            put.addColumn(Bytes.toBytes("cf_meta"), Bytes.toBytes("derniere_attaque"),
                    Bytes.toBytes(row.getAs("derniere_attaque") != null
                            ? row.getAs("derniere_attaque").toString() : ""));

            puts.add(put);
        }

        table.put(puts);
        table.close();
        System.out.println("  📊 " + puts.size() + " patterns insérés dans attack_patterns");
    }

    // ════════════════════════════════════════════════════════
    // TABLE 3 — threat_timeline
    // ════════════════════════════════════════════════════════
    private static void writeThreatTimeline(SparkSession spark, Connection connection)
            throws IOException {

        System.out.println("\n[HBase] Écriture → threat_timeline");

        Dataset<org.apache.spark.sql.Row> df = spark.read()
                .parquet("hdfs://namenode:9000/batch_results/threat_timeline")
                ;

        Table table = connection.getTable(TableName.valueOf("threat_timeline"));
        List<Put> puts = new ArrayList<>();

        for (org.apache.spark.sql.Row row : df.collectAsList()) {
            String date        = row.getAs("date").toString();
            String heure       = String.format("%02d", (int) row.getAs("heure"));
            String threatLabel = row.getAs("threat_label").toString();
            String rowKey      = date + "#" + heure + "#" + threatLabel;

            Put put = new Put(Bytes.toBytes(rowKey));

            put.addColumn(Bytes.toBytes("cf_time"), Bytes.toBytes("date"),
                    Bytes.toBytes(date));
            put.addColumn(Bytes.toBytes("cf_time"), Bytes.toBytes("heure"),
                    Bytes.toBytes(heure));
            put.addColumn(Bytes.toBytes("cf_time"), Bytes.toBytes("threat_label"),
                    Bytes.toBytes(threatLabel));
            put.addColumn(Bytes.toBytes("cf_volume"), Bytes.toBytes("nb_evenements"),
                    Bytes.toBytes(row.getAs("nb_evenements").toString()));
            put.addColumn(Bytes.toBytes("cf_volume"), Bytes.toBytes("total_bytes"),
                    Bytes.toBytes(row.getAs("total_bytes").toString()));
            put.addColumn(Bytes.toBytes("cf_volume"), Bytes.toBytes("avg_bytes"),
                    Bytes.toBytes(row.getAs("avg_bytes").toString()));
            put.addColumn(Bytes.toBytes("cf_volume"), Bytes.toBytes("nb_ips_uniques"),
                    Bytes.toBytes(row.getAs("nb_ips_uniques").toString()));

            puts.add(put);
        }

        table.put(puts);
        table.close();
        System.out.println("  📊 " + puts.size() + " entrées insérées dans threat_timeline");
    }
}
