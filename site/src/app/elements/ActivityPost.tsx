import React from 'react';
import { BsBookmark, BsBookmarkFill, BsChat, BsHeart, BsHeartFill } from 'react-icons/bs';
import { convertUrls, getDataFromAO, getDefaultProcess, getProfile, getWalletAddress, messageToAO, numberWithCommas, randomAvatar, timeOfNow, transferToken, uuid } from '../util/util';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';
import AlertModal from '../modals/AlertModal';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { Service } from '../../server/service';
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import { Tooltip } from 'react-tooltip'
import BountyModal from '../modals/BountyModal';
import { FaCoins } from 'react-icons/fa';
import { AO_STORY, STORY_INCOME } from '../util/consts';
import QuestionModal from '../modals/QuestionModal';
import MessageModal from '../modals/MessageModal';
import HoverPopup from './HoverPopup';

interface ActivityPostProps {
  data: any;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isPostPage?: boolean;
  txid?: string;
}

interface ActivityPostState {
  openImage: boolean;
  openBounty: boolean;
  navigate: string;
  content: string;
  message: string;
  alert: string;
  question: string;
  avatar: string;
  nickname: string;
  address: string;
  isBookmarked: boolean;
  showPopup: boolean;
  profile: any;
}

class ActivityPost extends React.Component<ActivityPostProps, ActivityPostState> {

  id: string;
  imgUrl: string;
  loading: boolean = false;

  avatarRef: any;
  popupRef: any;

  static service: Service = new Service();

  parseOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.name === 'img') {
        const props = attributesToProps(domNode.attribs);
        return <img className='ql-editor-image' onClick={(e) => this.tapImage(e, props.src)} {...props} />;
      }
    }
  };

  constructor(props: ActivityPostProps) {
    super(props);
    this.state = {
      openImage: false,
      openBounty: false,
      navigate: '',
      content: '',
      message: '',
      alert: '',
      question: '',
      avatar: '',
      nickname: '',
      address: '',
      isBookmarked: false,
      showPopup: false,
      profile: '',
    };

    this.avatarRef = React.createRef();
    this.popupRef = React.createRef();

    this.onBounty = this.onBounty.bind(this);
    this.openBounty = this.openBounty.bind(this);
    this.onClose = this.onClose.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);
    
    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  handleClickOutside = (event:any) => {
    if (this.popupRef.current && !this.popupRef.current.contains(event.target)) {
      this.setState({ showPopup: false });
    }
  };

  componentDidMount() {
    this.start();
    // document.addEventListener('mouse', this.handleClickOutside);

    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  componentWillUnmount() {
    // document.removeEventListener('mousedown', this.handleClickOutside);
    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].removeEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  // onQuestionYes() {
  //   this.onLike();
  //   this.setState({ question: '' });
  // }

  // onQuestionNo() {
  //   this.setState({ question: '' });
  // }

  openPopup() {
    this.setState({showPopup:true})
  }

  closePopup(e: any) {
    // if (this.popupRef.current && !this.popupRef.current.contains(event.target)) {
    // if (this.popupRef.current) {
    //   console.log('is popup')
    //   this.setState({ showPopup: true });
    // }
    // else
    // this.setState({showPopup:false})

    // 检查鼠标是否在浮窗区域内
    if (
      this.avatarRef.current
      // !this.popupRef.current.contains(e.relatedTarget) &&
      // !this.avatarRef.current.contains(e.relatedTarget)
    ) {
      this.setState({ showPopup: false });
    }
  }

  async start() {
    this.getPostContent();

    // for testing
    this.setState({ isBookmarked: this.props.data.isBookmarked });

    let address = await getWalletAddress();
    this.setState({ address });

    // let avatar = '';
    // if (this.props.data.address == address) {
    //   avatar = localStorage.getItem('avatar');
    //   if (!avatar) avatar = '';
    // }

    // this.createAvatar(avatar);
    this.getProfile(this.props.data.address);
  }

  // load profile from the process of user's
  async getProfile(address: string) {
    let profile = await getProfile(address);
    console.log("profile:", profile)
    profile = profile[0];
    if (profile)
      this.setState({ profile, avatar: profile.avatar, nickname: profile.nickname });
  }

  createAvatar(random: string) {
    const resp = createAvatar(micah, {
      seed: this.props.data.nickname + random,
    });

    const avatar = resp.toDataUriSync();
    this.setState({ avatar });
  }

  newAvatar(e: any) {
    if (this.props.data.address !== this.state.address) return;
    e.stopPropagation();

    let random = uuid();
    // localStorage.setItem('avatar', random);
    this.createAvatar(random);
  }

  async getPostContent() {
    let content = this.props.data.post;
    // content = convertHashTag(content);
    content = convertUrls(content);
    this.setState({ content });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({ openImage: true })
  }

  openBounty(e: any) {
    e.stopPropagation();

    let alert;
    if (!Server.service.getIsLoggedIn())
      alert = 'Please connect to wallet.';
    if (this.props.data.address == Server.service.getActiveAddress())
      alert = "You can't bounty to yourself.";

    if (alert) {
      this.setState({ alert });
      return;
    }

    this.setState({ openBounty: true })
  }

  onBounty(qty: string) {
    // console.log('onBounty -> qty: ', qty)
    this.props.data.coins = qty;
  }

  async onLike() {
    if (!Server.service.getIsLoggedIn()) {
      this.setState({ alert: 'Please connect to wallet.' });
      return;
    }

    this.setState({ message: 'Liking the story...' });

    let id = this.props.data.id;
    let action = 'UpdateLike';
    if (this.props.isReply) action = 'UpdateLikeForReply';

    await messageToAO(AO_STORY, id, action);

    // record the list of liked to ao
    let data = { id, address: this.props.data.address, time: timeOfNow() }
    // console.log("data:", data)
    let SendLike = await messageToAO(AO_STORY, data, 'SendLike');

    // this.onTransfer()

    this.props.data.likes += 1;
    this.props.data.isLiked = true;
    this.setState({ message: '' });
  }

  async onTransfer() {
    // the user's process to tranfer a bounty
    let to = await getDefaultProcess(this.props.data.address);
    console.log("to:", to)

    let alert;
    if (!to)
      alert = 'He/She has not a default process to transfer bounty.';

    if (alert) {
      this.setState({ alert, message: '' });
      return;
    }

    await transferToken(STORY_INCOME, to, '1');

    this.setState({ message: '' });

    // refreshing the number that displayed on the post.
    // this.props.data.coins += 1;

    // TODO: update the bounty (coins)
    // let data = { id: this.props.data.id, coins: '1' }
    // console.log("data:", data)
    // messageToAO(AO_STORY, data, 'UpdateBounty');
  }

  async onBookmark(e: any) {
    e.stopPropagation();
    this.setState({ isBookmarked: true });

    let data = this.props.data;

    // stored in localStorage
    let list = [];
    let val = localStorage.getItem('bookmarks');
    if (val) list = JSON.parse(val);
    list.push(data);

    localStorage.setItem('bookmarks', JSON.stringify(list))

    data.isBookmarked = true;
    Server.service.addPostToCache(data);
  }

  async removeBookmark(e: any, id: string) {
    e.stopPropagation();
    this.setState({ isBookmarked: false });

    let data = this.props.data;

    // get from localStorage
    let list = [];
    let val = localStorage.getItem('bookmarks');
    list = JSON.parse(val);

    let result = list.filter((item: any) => {
      return item.id !== id;
    });

    localStorage.setItem('bookmarks', JSON.stringify(result))
    data.isBookmarked = false;
    Server.service.addPostToCache(data);
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/user/') == 0)
      return;

    this.setState({ navigate: '/user/' + id });
  }

  goPostPage(id: string) {
    let pathname = window.location.pathname;
    if (pathname.indexOf('/post/') == 0 || pathname.indexOf('/story/') == 0) return;
    this.setState({ navigate: "/post/" + id });
  }

  onClose() {
    this.setState({ openImage: false, openBounty: false });
  }

  renderActionsRow(data: any) {
    let isStory = false;
    if (window.location.pathname.indexOf('/story/') == 0)
      isStory = true;

    return (
      <div className='activity-post-action-row'>
        {!this.props.isReply &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              <BsChat />
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(data.replies)}
            </div>
          </div>
        }

        {/* {(isStory || !this.props.isReply) &&
          <div
            className='activity-post-action'
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Bounty"
            onClick={(e) => this.openBounty(e)}
          >
            <div className='activity-post-action-icon'>
              <FaCoins />
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(data.coins)}
            </div>
          </div>
        } */}

        <div>
          {data.isLiked
            ?
            <div
              className='activity-post-action'
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Liked!"
            >
              <div className='activity-post-action-icon'>
                <BsHeartFill color='red' />
              </div>
              <div className='activity-post-action-number'>
                {numberWithCommas(data.likes)}
              </div>
            </div>
            :
            <div
              className='activity-post-action'
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Like the story and that will get a reward from Life."
              onClick={() => this.onLike()}
            >
              <div className='activity-post-action-icon'>
                <BsHeart />
              </div>
              <div className='activity-post-action-number'>
                {numberWithCommas(data.likes)}
              </div>
            </div>}
        </div>

        {Server.service.getIsLoggedIn() && !this.props.isReply && !isStory &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              {data.isBookmarked || this.state.isBookmarked
                ?
                <BsBookmarkFill
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Remove from bookmarks"
                  color='rgb(114, 114, 234)'
                  onClick={(e) => this.removeBookmark(e, data.id)}
                />
                :
                <BsBookmark
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Bookmark"
                  onClick={(e) => this.onBookmark(e)}
                />
              }
            </div>
          </div>
        }
      </div>
    )
  }

  openLink(txid: string) {
    window.open('https://www.ao.link/message/' + txid);
  }

  render() {
    let owner = (this.props.data.address == this.state.address);

    let avatar, nickname;
    let profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      avatar = profile.avatar
      nickname = profile.nickname
    }

    let data = this.props.data;
    let address = data.address;
    if (address)
      address = address.substring(0, 4) + '...' + address.substring(address.length - 4);

    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        className={`home-msg-line ${this.props.isReply || this.props.isPostPage ? 'no_hover' : ''}`}
        style={{ cursor: this.state.openImage || this.props.isReply || this.props.isPostPage ? 'auto' : 'pointer' }}
        onClick={() => this.goPostPage(data.id)}
      >

        <div className='home-msg-header'>
          <div className='activity-post-avatar-container'>
            {/* {this.state.showPopup && <HoverPopup data={this.state.profile} ref={this.popupRef} />} */}
            <img
            ref={this.avatarRef}
              className='home-msg-portrait'
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Go to the profile page"
              src={this.state.avatar ? this.state.avatar : randomAvatar()}
              onClick={(e) => this.goProfilePage(e, data.address)}
              // onMouseEnter={()=>this.openPopup()}
              // onMouseLeave={(e)=>this.closePopup(e)}
            />
          </div>

          <div className="home-msg-nickname">
            {this.state.nickname ? this.state.nickname : 'anonymous'}
          </div>

          <div className="home-msg-address">{address}</div>
          <div className='home-msg-time'>
            ·&nbsp;&nbsp;{formatTimestamp(data.time)}
          </div>

          {this.props.isPostPage && this.props.txid &&
            <img
              className='activity-post-arweave-icon'
              src='/ar.svg'
              onClick={() => this.openLink(this.props.txid)}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Go to ao.link"
            />
          }
        </div>

        <div className='home-message'>
          {parse(this.state.content, this.parseOptions)}
        </div>

        {this.renderActionsRow(data)}

        <BountyModal
          open={this.state.openBounty}
          onClose={this.onClose}
          onBounty={this.onBounty}
          data={this.props.data}
          isReply={this.props.isReply}
        />

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;