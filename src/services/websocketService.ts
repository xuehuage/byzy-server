import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';

const clientConnections = new Map<string, WebSocket>();
const WEBSOCKET_TIMEOUT = (4 * 60 + 30) * 1000; // 4.5分钟

let wss: WebSocketServer;

export const initWebSocketServer = (server: any) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const clientSn = url.searchParams.get('client_sn');

        if (!clientSn) {
            ws.close(1008, 'Missing client_sn');
            return;
        }

        // 设置超时自动关闭
        const timeout = setTimeout(() => {
            ws.close(1000, 'Timeout');
            clientConnections.delete(clientSn);
        }, WEBSOCKET_TIMEOUT);

        clientConnections.set(clientSn, ws);
        console.log(`WebSocket连接: ${clientSn}, 当前连接数: ${clientConnections.size}`);

        ws.on('close', () => {
            clearTimeout(timeout);
            clientConnections.delete(clientSn);
        });

        ws.on('error', () => {
            clearTimeout(timeout);
            clientConnections.delete(clientSn);
        });

        // 发送连接确认
        ws.send(JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            client_sn: clientSn
        }));
    });
};

export const notifyPaymentSuccess = (clientSn: string, paymentData: any) => {
    const ws = clientConnections.get(clientSn);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'PAYMENT_SUCCESS',
            data: paymentData
        }));
        return true;
    }
    return false;
};