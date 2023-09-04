import { useEffect, useRef, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const webSocketRef = useRef<WebSocket>();
  const [inputText, setInputText] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // ローカルストリームを状態として管理

  useEffect(() => {
    // ローカルストリームの取得
    if (!localStream) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setLocalStream(stream);
        })
        .catch((error) => {
          console.error('ビデオストリームの取得エラー:', error);
        });
    }
  }, [localStream]);

  useEffect(() => {
    // WebSocket接続の設定
    const socketConnection = new WebSocket('ws://localhost:8000');
    webSocketRef.current = socketConnection;

    socketConnection.addEventListener('message', (event) => {
      setMessage(event.data);
    });

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  const emitTo = (msg: any) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(msg));
    }
  };

  const createAnswer = (offer: RTCSessionDescription) => {
    if (!localStream) {
      console.error('ローカルストリームがありません');
      return;
    }

    const peerConnection = new RTCPeerConnection({ iceServers: [] });
    console.log('peerConnection', peerConnection);

    // ローカルストリームを追加
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      // ビデオを受信したときの処理
      const stream = event.streams[0];
      // rtc-video要素にストリームを表示
      const recieveVideo = document.getElementById('rtc-video') as HTMLVideoElement | null;
      console.log('recieveVideo', recieveVideo);
      if (recieveVideo) {
        recieveVideo.srcObject = stream;
      } else {
        console.error('rtc-videoが見つかりませんでした');
      }
    };

    peerConnection.onicecandidate = (evt) => {
      // ICE candidateの処理
      if (evt.candidate) {
        // ICE candidateを送信
        emitTo({ type: 'candidate', candidate: evt.candidate });
      } else {
        // 全てのICE candidateが生成されたとき
        peerConnection
          .createAnswer()
          .then((answerSDP) => {
            return peerConnection.setLocalDescription(answerSDP);
          })
          .then(() => {
            // Answer SDPを送信
            emitTo({ type: 'answer', sdp: peerConnection.localDescription?.sdp });
          })
          .catch((error) => {
            console.error('Answer SDPの生成またはセットにエラーが発生しました:', error);
          });
      }
    };

    // リモートオファーをセット
    peerConnection
      .setRemoteDescription(offer)
      .then(() => {
        // Answerを生成
        console.log('peerConnection', peerConnection);
        return peerConnection.createAnswer();
      })
      .then((answerSDP) => {
        // Answerをローカルにセット
        return peerConnection.setLocalDescription(answerSDP);
      })
      .then(() => {
        console.log('Answer SDPが生成され、セットされました。');
      })
      .catch((error) => {
        console.error('Answer SDPの生成またはセットにエラーが発生しました:', error);
      });
  };

  const handleConnect = () => {
    if (!localStream) {
      console.error('ローカルストリームがありません');
      return;
    }

    // オファーを生成
    const peerConnection = new RTCPeerConnection({ iceServers: [] });

    // ローカルストリームを追加
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection
      .createOffer()
      .then((offerSDP) => {
        // ローカルオファーをセット
        console.log(offerSDP);
        return peerConnection.setLocalDescription(offerSDP);
      })
      .then(() => {
        // オファーをサーバーに送信
        emitTo({ type: 'offer', sdp: peerConnection.localDescription?.sdp });
        console.log('d');
      })
      .catch((error) => {
        console.error('Offer SDPの生成またはセットにエラーが発生しました:', error);
      });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    webSocketRef.current?.send(inputText);
  };

  return (
    <>
      <video id="my-video" width="400" autoPlay muted /> {/* 自分のビデオ */}
      <video id="rtc-video" width="400" autoPlay /> {/* 相手のビデオ */}
      <button type="button" id="connectButton" onClick={handleConnect}>
        Connect
      </button>
      <br />
      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} />
      <div>{message}</div>
    </>
  );
}

export default App;
