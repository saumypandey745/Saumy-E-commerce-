const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'adminpassword'
});

const uploadDocument = async (bucketName, fileName, fileBuffer, mimeType) => {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
        }
        
        const metaData = { 'Content-Type': mimeType };
        await minioClient.putObject(bucketName, fileName, fileBuffer, metaData);
        
        // Return public URL assuming the bucket has public read access configured
        const endpoint = process.env.MINIO_ENDPOINT === 'minio' ? 'localhost' : process.env.MINIO_ENDPOINT;
        const port = process.env.MINIO_PORT || 9000;
        return `http://${endpoint}:${port}/${bucketName}/${fileName}`;
    } catch (err) {
        console.error('MinIO Upload Error:', err);
        throw err;
    }
};

module.exports = { minioClient, uploadDocument };
