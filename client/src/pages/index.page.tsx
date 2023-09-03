import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
function App() {
  let peerConnection = new RTCPeerConnection();

  const socket = io('http://localhost:5000');

  // サーバーへの送信用
  const emitTo = (msg: any) => {
    socket.emit('message', msg);
  };

  socket.on('message', (message: RTCSessionDescription) => {
    // 自分のメッセージには反応しないように

    if (message.type === 'offer') {
      const offer = new RTCSessionDescription(message);
      setOffer(offer);
    } else if (message.type === 'answer') {
      const answer = new RTCSessionDescription(message);
      setAnswer(answer);
    }
  });

  // createOffer()メソッドを呼び出す
  peerConnection
    .createOffer()
    .then((sessionDescription) => {
      return peerConnection.setLocalDescription(sessionDescription);
    })
    .catch((error) => {
      console.error('Error creating offer:', error);
    });

  const sessionDescription = new RTCSessionDescription({
    type: 'answer', // または 'offer'
    sdp: 'ここにSDPデータを設定します',
  });

  peerConnection.setRemoteDescription(sessionDescription).then(() => {
    // answer SDP生成用の処理をここに書く
  });

  peerConnection.createAnswer().then((sessionDescription) => {
    return peerConnection.setLocalDescription(sessionDescription);
  });

  const setAnswer = (sessionDescription: RTCSessionDescription) => {
    peerConnection.setRemoteDescription(sessionDescription).then(() => {
      console.log('準備完了！');
    });
  };

  const [message, setMessage] = useState('');
  const webSocketRef = useRef<WebSocket>();

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');
    webSocketRef.current = socket;

    socket.addEventListener('message', (event) => {
      setMessage(event.data);
    });

    return () => socket.close();
  }, []);

  const [inputText, setInputText] = useState('');
  const submit: React.FormEventHandler = useCallback(
    (event) => {
      event.preventDefault();
      webSocketRef.current?.send(inputText);
    },
    [inputText]
  );

  const myVideo = document.getElementById('my-video');
  const recieveVideo = document.getElementById('rtc-video') as HTMLVideoElement | null;
  if (myVideo instanceof HTMLVideoElement) {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        localStream = stream;
        playVideo(myVideo, localStream);
      })
      .catch((error) => {
        console.error('ビデオの取得に失敗しました:', error);
      });
  } else {
    console.error('ビデオ要素が見つかりませんでした');
  }

  const playVideo = (element: HTMLVideoElement, stream: MediaStream) => {
    element.srcObject = stream;
    element.play();
    element.volume = 0;
  };

  const connectButton = document.getElementById('connectButton');

  if (connectButton) {
    connectButton.onclick = () => {
      makeOffer();
    };
  } else {
    console.error('connectButtonが見つかりませんでした');
  }
  let localStream: MediaStream;

  let videoTrack: MediaStreamTrack;
  const makeOffer = () => {
    // RTCPeerConnectionのオブジェクトを作る
    const pc_config = { iceServers: [] };
    peerConnection = new RTCPeerConnection(pc_config);

    // 送りたいstreamを設定する。これがないとSDPに書くことがなくなる
    peerConnection.addTrack(videoTrack, localStream);

    // trackが追加された際に発火。ビデオを表示する
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (recieveVideo) {
        playVideo(recieveVideo, stream);
      } else {
        console.error('rtc-videoが見つかりませんでした');
      }
    };
    // ice生成時イベントの処理を登録する。候補生成が全部完了したら送信。
    peerConnection.onicecandidate = (evt) => {
      if (evt.candidate) {
        // ice candidateを一個分生成した時
      } else {
        const localDescription = peerConnection.localDescription;
        if (localDescription) {
          const message = { type: localDescription.type, sdp: localDescription.sdp };

          // サーバーにSDPを送信
          emitTo(message);
        } else {
          console.error('localDescriptionがnullです');
        }
      }
    };

    // offer SDPを生成。
    peerConnection.createOffer().then((sessionDescription) => {
      // 返ってきたsessionDescriptionを登録。
      return peerConnection.setLocalDescription(sessionDescription);
      // この際にpeerConnection.onicecandidateイベントが発火する
    });
  };

  const setOffer = (sessionDescription: RTCSessionDescription) => {
    // RTCPeerConnectionのオブジェクトを作る
    const pc_config = { iceServers: [] };
    peerConnection = new RTCPeerConnection(pc_config);

    // 送りたいstreamを設定する。
    peerConnection.addTrack(videoTrack, localStream);
    // trackが追加された際に発火。ビデオを表示する
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (recieveVideo) {
        playVideo(recieveVideo, stream);
      } else {
        console.error('rtc-videoが見つかりませんでした');
      }
    };
    // ice生成時イベントの処理を登録する。
    peerConnection.onicecandidate = (evt) => {
      if (evt.candidate) {
        // ice candidateを一個分生成した時
      } else {
        const localDescription = peerConnection.localDescription;
        if (localDescription) {
          const message = { type: localDescription.type, sdp: localDescription.sdp };

          // サーバーにSDPを送信
          emitTo(message);
        } else {
          console.error('localDescriptionがnullです');
        }
      }
    };

    peerConnection.setRemoteDescription(sessionDescription).then(() => {
      makeAnswer();
    });
  };

  const makeAnswer = () => {
    peerConnection.createAnswer().then((sessionDescription) => {
      return peerConnection.setLocalDescription(sessionDescription);
      // この際にpeerConnection.onicecandidate()が発火し、得られたanswer sdpを送信する。
    });
  };

  return (
    <>
      <video id="my-video" width="400" />
      <video id="rtc-video" width="400" />
      <button type="button" id="connectButton">
        connect
      </button>
      <br />
      <script type="module" src="src/app.js" />
    </>
  );
}

export default App;
