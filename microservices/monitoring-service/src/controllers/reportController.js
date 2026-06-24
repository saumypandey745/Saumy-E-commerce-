const { getMongoStats } = require('../services/mongoStatsService');
const dockerService = require('../services/dockerService');

exports.exportSystemReport = (req, res) => {
    try {
        const dockerMetrics = dockerService.getMetrics();
        const mongoMetrics = getMongoStats();
        
        const report = {
            generated_at: new Date().toISOString(),
            cluster_health: {
                active_containers: dockerMetrics.active_pods,
                total_cpu_usage: dockerMetrics.cpu,
                total_memory_usage: dockerMetrics.memory
            },
            database_health: {
                mongo_connections: mongoMetrics.connections,
                queries_per_sec: mongoMetrics.queries_per_sec
            },
            containers: dockerMetrics.containers
        };

        const format = req.query.format || 'json';

        if (format === 'csv') {
            const csvRows = [];
            csvRows.push(['Container Name', 'State', 'Status', 'CPU', 'Mem']);
            report.containers.forEach(c => {
                csvRows.push([c.name, c.state, c.status, c.cpu, c.mem]);
            });
            const csvString = csvRows.map(e => e.join(",")).join("\n");
            
            res.header('Content-Type', 'text/csv');
            res.attachment('system_report.csv');
            return res.send(csvString);
        }

        if (format === 'pdf') {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument();
            
            res.header('Content-Type', 'application/pdf');
            res.attachment('system_report.pdf');
            doc.pipe(res);
            
            doc.fontSize(20).text('Enterprise System Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated At: ${report.generated_at}`);
            doc.moveDown();
            
            doc.fontSize(16).text('Cluster Health');
            doc.fontSize(12).text(`Active Containers: ${report.cluster_health.active_containers}`);
            doc.text(`Total CPU Usage: ${report.cluster_health.total_cpu_usage}`);
            doc.text(`Total Memory Usage: ${report.cluster_health.total_memory_usage}`);
            doc.moveDown();
            
            doc.fontSize(16).text('Database Health');
            doc.fontSize(12).text(`Mongo Connections: ${report.database_health.mongo_connections}`);
            doc.text(`Queries Per Second: ${report.database_health.queries_per_sec}`);
            doc.moveDown();
            
            doc.fontSize(16).text('Containers');
            report.containers.forEach(c => {
                doc.fontSize(10).text(`- ${c.name} (${c.status}) | CPU: ${c.cpu} | Mem: ${c.mem}`);
            });
            
            doc.end();
            return;
        }

        return res.json(report);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
