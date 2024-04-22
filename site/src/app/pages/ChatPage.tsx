import React from 'react';
import './ChatPage.css';
import { createDataItemSigner, message, dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { formatTimestamp, getDataFromAO, getProfile, getWalletAddress, messageToAO, timeOfNow } from '../util/util';
import { CHATROOM, MINI_SOCIAL } from '../util/consts';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import Logo from '../elements/Logo';

declare var window: any;
var msg_timer: any;

interface ChatPageState {
  msg: string;
  messages: any;
  question: string;
  alert: string;
  address: string;
  friend: string;
  loading: boolean;
  my_avatar: string;
  my_nickname: string;
  friend_avatar: string;
  friend_nickname: string;
}

class ChatPage extends React.Component<{}, ChatPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      msg: '',
      messages: '',
      question: '',
      alert: '',
      address: '',
      friend: '',
      loading: true,
      my_avatar: '',
      my_nickname: '',
      friend_avatar: '',
      friend_nickname: '',
    };

    this.getMessages = this.getMessages.bind(this);
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    clearInterval(msg_timer);
  }

  async start() {
    let friend = window.location.pathname.substring(6);
    // console.log("friend:", friend)

    let address = await getWalletAddress();
    // console.log("me:", address)

    this.setState({ address, friend });

    //
    let my_profile = await getProfile(address);
    // console.log("my_profile:", my_profile)
    my_profile = my_profile[0];
    if (my_profile)
      this.setState({
        my_avatar: my_profile.avatar,
        my_nickname: my_profile.nickname,
      })

    //
    let friend_profile = await getProfile(friend);
    // console.log("friend_profile:", friend_profile)
    friend_profile = friend_profile[0];
    if (friend_profile)
      this.setState({
        friend_avatar: friend_profile.avatar,
        friend_nickname: friend_profile.nickname,
      })


    setTimeout(() => {
      this.getMessages();
    }, 50);

    msg_timer = setInterval(this.getMessages, 2000);
    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  async getMessages() {
    // console.log("Chat Page -->")
    let messages = await getDataFromAO(MINI_SOCIAL, 'GetMessages', '0', this.state.friend, this.state.address);
    // console.log("messages:", messages)

    this.setState({ messages, loading: false });
    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }


  createAvatar(nickname: string) {
    const resp = createAvatar(micah, {
      seed: nickname,
    });

    return resp.toDataUriSync();
  }

  renderMessages() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];

    for (let i = 0; i < this.state.messages.length; i++) {
      // let data = JSON.parse(this.state.messages[i]);
      let data = this.state.messages[i];
      let owner = (data.address == this.state.address);
      let address = data.address;
      address = address.substring(0, 3) + '...' + address.substring(address.length - 3);

      divs.push(
        <div key={i} className={`chat-msg-line ${owner ? 'my-line' : 'other-line'}`}>
          {!owner && <img className='chat-msg-portrait' src={this.state.friend_avatar} />}
          <div>
            <div className={`chat-msg-header ${owner ? 'my-line' : 'other-line'}`}>
              <div className="chat-msg-nickname">{owner ? this.state.my_nickname : this.state.friend_nickname}</div>
              <div className="chat-msg-address">{address}</div>
            </div>
            <div className={`chat-message ${owner ? 'my-message' : 'other-message'}`}>
              {data.message}
            </div>
            <div className={`chat-msg-time ${owner ? 'my-line' : 'other-line'}`}>
              {data.time ? formatTimestamp(data.time, true) : 'old msg'}
            </div>
          </div>
          {owner && <img className='chat-msg-portrait' src={this.state.my_avatar} />}
        </div>
      )
    }

    return divs.length > 0 ? divs : <div>No messages yet.</div>
  }

  async sendMessage() {
    let msg = this.state.msg.trim();
    if (!msg) {
      this.setState({ alert: 'Please input a message.' })
      return;
    } else if (msg.length > 500) {
      this.setState({ alert: 'Message can be up to 500 characters long.' })
      return;
    }

    this.setState({ msg: '' });

    let data = { address: this.state.address, friend: this.state.friend, message: msg, time: timeOfNow() };
    // console.log("data:", data)
    let response = await messageToAO(MINI_SOCIAL, data, 'SendMessage');

    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // prevent the form submit action
      this.sendMessage();
    }
  }

  scrollToBottom() {
    var scrollableDiv = document.getElementById("scrollableDiv");
    if (scrollableDiv) {
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    } else {
      console.error("Element with id 'scrollableDiv' not found.");
    }
  }

  render() {
    return (
      <div className="chat-page">
        {/* <div>AO Public Chatroom</div> */}
        <Logo />
        {!this.state.loading &&
          <div className='chat-page-header'>
            <img className='chat-msg-portrait header' src={this.state.friend_avatar} />
            <div className="chat-msg-nickname header">{this.state.friend_nickname}</div>
          </div>
        }

        <div id='scrollableDiv' className="chat-chat-container">
          {this.renderMessages()}
        </div>

        <div>
          <input
            id='input_msg'
            className="chat-input-message"
            placeholder="message"
            value={this.state.msg}
            onChange={(e) => this.setState({ msg: e.target.value })}
            onKeyDown={this.handleKeyDown}
          />
          <button className="chat-send-button" onClick={() => this.sendMessage()}>Send</button>
        </div>

        {/* <MessageModal message={this.state.message} /> */}
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default ChatPage;