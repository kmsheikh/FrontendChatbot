import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';

import './Monitor.css';

interface JoinLobbyProps {
  socket : Socket;
}

interface LobbbyInformationProps {
  users : string[];
}

export function Monitor(props : JoinLobbyProps) {
  const [name,       setName]       = useState('Guest');
  const [code,       setCode]       = useState('');
  const [disabled,   setDisabled]   = useState(false);
  const [lobbyState, setLobbyState] = useState('Not Joined');
  const [userList,   setUserList]   = useState<string[]>([]);

  // Initialize the state with x boxes when the component is mounted
  useEffect(() => {
    // Retrieve the name parameter from the URL
    const searchParams = new URLSearchParams(window.location.search);
    const nameFromURL = searchParams.get('name') || 'Guest';

    const formattedName = nameFromURL.replace(/\b\w/g, match => match.toUpperCase());

    // Set the name synchronously before initializing the boxes
    setName(() => formattedName);
  }, []);

  useEffect(() => {
    props.socket.emit('getLobbyCode');
    console.log("getLobbyCode");
  
    // Wait for lobbycode
    props.socket.on('getLobbyCodeResponse', (guid) => {
      console.log("getLobbyCodeResponse:", guid);
      setCode(guid);
    });
  },[]);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  
  //   setLobbyState('Waiting');
  
  //   // Emit a Socket.IO event to join the lobby
  //   props.socket.emit('joinLobby', code, name);
  
  //   // Listen for the server's response
  //   props.socket.on('joinedLobby', (guid) => {
  //     setLobbyState('Joined');
  //     setDisabled(true);
  //   });
  
  //   props.socket.on('lobbyError', (error) => {
  //     console.error('Error joining lobby:', error);
  //     setLobbyState('Error');
  //   });
  // };

  useEffect(() => {
    const handleChatStarted = () => {
      const encodedId = encodeURIComponent(code);
      window.location.href = `chatroom?name=${name}&id=${encodedId}`;
  
      // Turn off the event listener after it has been used once
      props.socket.off('chatStarted', handleChatStarted);
    };
  
    // Set up event listeners
    props.socket.on('chatStarted', handleChatStarted);
  
    // Clean up event listeners when the component unmounts
    return () => {
      // Turn off event listeners
      props.socket.off('chatStarted', handleChatStarted);
    };
  }, [code, name]);

  useEffect(() => {
    props.socket.emit('getUserListOfLobby', code)

    const intervalId = setInterval(() => {
      props.socket.emit('getUserListOfLobby', code);
      console.log(userList);
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [code, lobbyState, props.socket]);

  useEffect(() => {
    props.socket.on('userListOfLobbyResponse', (userListObj: {userList: string[]}) => {
      setUserList(userListObj.userList);
    })

    props.socket.on('userListOfLobbyResponseError', () => {});
  }, []);

  return (
    //three main sections: screen, content box, members box
    <div className="screen">
      <div>
        <h1 className="joinheader">Monitor</h1>
      </div>

      <div className="logo-container">
        <img src="logo.jpg" alt="Logo" className="logo" />
      </div>

      <a href="home">
        <button className="top-right-button">Generate Chatroom</button>
      </a>

      {/* {(lobbyState === 'Waiting') && 
      <p className="waiting-paragraph">
        Attempting to join lobby...
      </p>} */}
      
      {<LobbyInformation users={userList}/>}

      {/* {(lobbyState === 'Error') && 
      <p className="waiting-paragraph">
        Error joining room. Please try again.
      </p>} */}
    </div>
  );
}

interface UserBoxProps {
  content: string;
  index : number;
}

function LobbyInformation(props : LobbbyInformationProps) {
  const [boxes, setBoxes] : any[] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let initialBoxes = [];
    for (let i = 0; i < props.users.length; i++) {
      initialBoxes.push(<UserBox content={props.users[i]} index={i}/>);
    }

    setBoxes(initialBoxes);
    setIndex(props.users.length-1);
  }, [props.users]);

  const UserBox = (props : UserBoxProps) => {
    return (
      <div className="b" key={props.index}>
        <div className="profile-icon">
          <img src="logo.jpg" alt="Logo" className="logo-icon" />{' '}
        </div>
        <div className="box-content">{props.content}</div>
      </div>
    )
  }

  return (
    <div className='lobby-info'>

      <p className="waiting-paragraph">
        Waiting for students to join . . .
      </p>
      
      <div className="border-container">
        <p className="members-paragraph">Members</p>
        <div className="boxes">{boxes}</div>
      </div>
    </div>
  );
}