const Docker = require('dockerode');

// Connect to the local Docker socket. 
// Note: In production k8s, this would be a KubeAPI client.
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

let cachedMetrics = {
    active_pods: 0,
    cpu: '0%',
    memory: '0 GB / 0 GB',
    restarts: 0,
    containers: []
};

// Start a background polling loop to avoid flooding the Docker Daemon
const startPolling = () => {
    setInterval(async () => {
        try {
            const containers = await docker.listContainers();
            
            let totalCpu = 0;
            let totalMem = 0;
            let memLimit = 0;
            let totalRestarts = 0;
            
            const detailedContainers = [];

            for (const containerInfo of containers) {
                // If it's not a platform container (e.g. mongo, redis, or our node services), we still count it
                const container = docker.getContainer(containerInfo.Id);
                const stats = await container.stats({ stream: false });
                
                // Calculate CPU %
                const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                let cpuPercent = 0.0;
                if (systemCpuDelta > 0 && cpuDelta > 0) {
                    cpuPercent = (cpuDelta / systemCpuDelta) * stats.cpu_stats.online_cpus * 100.0;
                }
                
                // Memory
                const memUsage = stats.memory_stats.usage || 0;
                const limit = stats.memory_stats.limit || 0;
                
                totalCpu += cpuPercent;
                totalMem += memUsage;
                memLimit += limit;
                
                const name = containerInfo.Names[0].replace('/', '');
                
                detailedContainers.push({
                    name,
                    state: containerInfo.State,
                    status: containerInfo.Status,
                    cpu: cpuPercent.toFixed(2) + '%',
                    mem: (memUsage / 1024 / 1024).toFixed(2) + 'MB'
                });
            }

            cachedMetrics = {
                active_pods: containers.length,
                cpu: totalCpu.toFixed(1) + '%',
                memory: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB / ${(memLimit / 1024 / 1024 / 1024).toFixed(2)} GB`,
                restarts: totalRestarts, // In a real setup, we extract RestartCount from container.inspect()
                containers: detailedContainers
            };
            
        } catch (err) {
            console.error('Docker polling error:', err.message);
        }
    }, 5000); // Poll every 5 seconds
};

const getMetrics = () => cachedMetrics;

const getContainerLogs = async (containerName) => {
    try {
        const containers = await docker.listContainers({ all: true });
        const containerInfo = containers.find(c => c.Names[0].includes(containerName));
        if (!containerInfo) return 'Container not found';
        
        const container = docker.getContainer(containerInfo.Id);
        const logs = await container.logs({ stdout: true, stderr: true, tail: 100 });
        return logs.toString('utf8');
    } catch (err) {
        return `Error fetching logs: ${err.message}`;
    }
};

module.exports = { startPolling, getMetrics, getContainerLogs };
