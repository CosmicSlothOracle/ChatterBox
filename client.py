import asyncio

import websockets


async def listen(websocket):
    try:
        async for message in websocket:
            print(message)
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")


async def send_messages(websocket):
    try:
        while True:
            message = await asyncio.to_thread(input, "> ")
            if not message:
                continue
            await websocket.send(message)
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")


async def main(host="127.0.0.1", port=8080):
    uri = f"ws://{host}:{port}"
    async with websockets.connect(uri) as websocket:
        await asyncio.gather(listen(websocket), send_messages(websocket))


if __name__ == "__main__":
    asyncio.run(main())
