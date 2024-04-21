import React from 'react';
import './HomePage.css';
import { publish, subscribe } from '../util/event';
import { dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { checkContent, connectWallet, getDataFromAO, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid, getDefaultProcess, spawnProcess, evaluate, isBookmarked, downloadFromArweave, parsePosts, storePostInLocal, getTokenBalance, randomAvatar, getProfile } from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { AOT_TEST, MINI_SOCIAL, LUA, PAGE_SIZE, TIP_IMG } from '../util/consts';
import QuestionModal from '../modals/QuestionModal';
import { Server } from '../../server/server';
import { BsSend } from 'react-icons/bs';
import Loading from '../elements/Loading';
import { Tooltip } from 'react-tooltip';
import EditProfileModal from '../modals/EditProfileModal';
import Logo from '../elements/Logo';

declare var window: any;

interface HomePageState {
  posts: any;
  avatar: string;
  nickname: string;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  // loadAvatar: boolean;
  range: string;
  isLoggedIn: string;
  address: string;
  process: string;
  newPosts: number;
  temp_tip: boolean;
  openEditProfile: boolean;
  profile: any;
}

class HomePage extends React.Component<{}, HomePageState> {

  quillRef: any;
  wordCount = 0;
  refresh: any;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      avatar: '',
      nickname: '',
      question: '',
      alert: '',
      message: '',
      loading: true,
      loadNextPage: false,
      range: 'everyone',
      isLoggedIn: '',
      address: '',
      process: '',
      newPosts: 0,
      temp_tip: false,
      openEditProfile: false,
      profile: '',
    };

    this.getPosts = this.getPosts.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.atBottom = this.atBottom.bind(this);
    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();
    window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
    Server.service.addPositionToCache(window.pageYOffset);
  }

  openEditProfile() {
    this.setState({ openEditProfile: true });
  }

  onCloseEditProfile() {
    this.setState({ openEditProfile: false });
    this.getProfile()
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight)
      if (!this.state.loading && !this.state.loadNextPage)
        this.nextPage();
  }

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  async start() {
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });

    // let nickname = localStorage.getItem('nickname');
    // if (nickname) this.setState({ nickname });

    await this.getPosts();
    this.getProfile()

    // check the new post every 10 seconds.
    // this.refresh = setInterval(() => this.refreshPosts(), 10000);
  }

  async connectWallet() {
    let connected = await connectWallet();
    if (connected) {
      let address = await getWalletAddress();
      this.setState({ isLoggedIn: 'true', address });
      this.register(address);

      Server.service.setIsLoggedIn(address);
      Server.service.setActiveAddress(address);
      publish('wallet-events');

      // your own process 
      let process = await getDefaultProcess(address);
      console.log("Your process:", process)

      // Spawn a new process
      if (!process) {
        process = await spawnProcess();
        console.log("Spawn --> processId:", process)
      }

      setTimeout(async () => {
        // load lua code into the process
        let messageId = await evaluate(process, LUA);
        console.log("evaluate -->", messageId)
      }, 10000);

      // for testing - will be removed
      // this.setState({ temp_tip: true, process });

      // let bal_aot = await getTokenBalance(AOT_TEST, process);
      // Server.service.setBalanceOfAOT(bal_aot);
    }
  }

  // Register one user
  // This is a temp way, need to search varibale Members
  // to keep one, on browser side or AOS side (in lua code)
  async register(address: string) {
    let data = { address, avatar: '', banner: '', nickname: '', bio: '', time: timeOfNow() };
    messageToAO(MINI_SOCIAL, data, 'Register');
  }

  async disconnectWallet() {
    await window.arweaveWallet.disconnect();
    this.setState({ isLoggedIn: '', address: '', question: '' });

    // for testing
    Server.service.setIsLoggedIn('');
    Server.service.setActiveAddress('');
    publish('wallet-events');
  }

  onQuestionYes() {
    this.disconnectWallet();
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async getTokens() {
    // the ID of the token
    const tokenID = "rN1B9kLV3ilqMQSd0bqc-sjrvMXzQkKB-JtfUeUUnl8";

    // check if the token has been added
    // const isAdded = await window.arweaveWallet.isTokenAdded(tokenID);
    // console.log("isAdded:", isAdded)

    // add token if it hasn't been added yet
    // if (!isAdded) {
    //   await window.arweaveWallet.addToken(tokenID);
    // }
  }

  async refreshPosts() {
    let posts_amt = localStorage.getItem('posts_amt');
    if (posts_amt) {
      let posts = await getDataFromAO(MINI_SOCIAL, 'GetPosts');
      let newPosts = posts.length - Number(posts_amt);
      localStorage.setItem('posts_amt', posts.length.toString());
      console.log("newPosts amt:", newPosts)
      if (newPosts > 0)
        this.setState({ newPosts });
    }
  }

  async showNewPosts() {
    let posts = await getDataFromAO(MINI_SOCIAL, 'GetPosts', '1', this.state.newPosts.toString());
    let final = parsePosts(posts);
    let total = final.concat(this.state.posts);
    this.setState({ posts: [] });

    setTimeout(() => {
      window.scrollTo(0, 0);
      this.setState({ posts: total, newPosts: 0 });
      Server.service.addPostsToCache(total);
    }, 10);
  }

  async getProfile() {
    let profile = await getProfile(Server.service.getActiveAddress());
    console.log("profile:", profile)
    if (profile.length > 0)
      this.setState({ profile, avatar: profile[0].avatar, nickname: profile[0].nickname });
  }

  async getPosts(new_post?: boolean) {
    let posts = Server.service.getPostsFromCache();
    let position = Server.service.getPositionFromCache();

    if (!posts || new_post) {
      posts = await getDataFromAO(MINI_SOCIAL, 'GetPosts');
      console.log("posts:", posts)
      // let final = parsePosts(posts);
      this.checkBookmarks(posts);
      return;
    }

    this.checkBookmarks(posts);
    this.setState({ posts, loading: false });
    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let pageNo = Server.service.getPageNo();
    pageNo += 1;
    Server.service.setPageNo(pageNo);
    console.log("pageNo:", pageNo)

    let posts = await getDataFromAO(MINI_SOCIAL, 'GetPosts', 'pageNo', PAGE_SIZE);
    let total = this.state.posts.concat(parsePosts(posts));
    this.checkBookmarks(total);
  }

  async checkBookmarks(posts: any) {
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    for (let i = 0; i < posts.length; i++) {
      let resp = isBookmarked(bookmarks, posts[i].id);
      posts[i].isBookmarked = resp;
    }

    Server.service.addPostsToCache(posts);
    this.setState({ posts, loading: false, loadNextPage: false });
  }

  renderPosts() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++) {
      divs.push(
        <ActivityPost
          key={i}
          data={this.state.posts[i]}
        />
      )
    }

    return divs.length > 0 ? divs : <div>No post yet.</div>
  }

  async onPost() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ isLoggedIn: '', alert: 'You should connect to wallet first.' });
      return;
    }

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;
    let nickname = this.state.nickname.trim();
    if (nickname.length > 25) {
      this.setState({ alert: 'Nickname can be up to 25 characters long.' })
      return;
    }

    // localStorage.setItem('nickname', nickname);
    // if (!nickname) nickname = 'anonymous';

    let data = {
      id: uuid(), address, post, range: this.state.range,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(MINI_SOCIAL, data, 'SendPost');

    if (response) {
      this.quillRef.setText('');
      this.setState({ message: '', alert: 'Post successful.', posts: [], loading: true });
      this.getPosts(true);
      // storePostInLocal(data);

      // store the txid of the post. 
      let info = { id: data.id, txid: response };
      messageToAO(MINI_SOCIAL, info, 'SendTxid');
    }
    else
      this.setState({ message: '', alert: TIP_IMG });
  }

  render() {
    if (!this.state.isLoggedIn) {
      return (
        <div className='home-page-welcome'>
          <div className='home-page-welcome-logo-row'>
            <img className='home-page-welcome-logo' src='/ao.png' />
            <div className='app-logo-text'>mini social</div>
          </div>
          <h1>A Mini Social that takes the simple to you</h1>
          <button className="home-connect-button" onClick={() => this.connectWallet()}>
            Connect ArConnect
          </button>
        </div>
      )
    }

    let address = this.state.address;
    if (this.state.isLoggedIn)
      address = address.substring(0, 4) + '...' + address.substring(address.length - 4);

    return (
      <div className="home-page">
        <div className='home-page-header'>
          <Logo />

          <div className='home-page-profile'>
            <div
              className='home-page-portrait-container'
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Change the profile"
              onClick={this.openEditProfile}
            >
              <img
                className='home-page-portrait'
                src={this.state.avatar ? this.state.avatar : randomAvatar()}
              />
              <div className="home-page-nickname">
                {this.state.nickname ? this.state.nickname : 'anonymous'}
              </div>
            </div>

            <div
              className="home-page-address"
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Disconnect from wallet"
              onClick={() => this.setState({ question: 'Disconnect?' })}>
              {address}
            </div>
          </div>
        </div>

        {this.state.isLoggedIn &&
          <div className="home-input-container">
            <SharedQuillEditor
              placeholder='What is happening?!'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='home-actions'>
              <select
                className="home-filter"
                value={this.state.range}
                onChange={this.onRangeChange}
              >
                <option value="everyone">Everyone</option>
                <option value="following">Following</option>
                <option value="private">Private</option>
              </select>

              <div className="app-icon-button" onClick={() => this.onPost()}>
                <BsSend size={20} />
                <div>Post</div>
              </div>
            </div>
          </div>
        }

        <div className="home-chat-container">
          {this.renderPosts()}
        </div>

        {this.state.newPosts > 0 &&
          <div className='home-page-tip-new-posts' onClick={() => this.showNewPosts()}>
            {this.state.newPosts}&nbsp;&nbsp;New Posts
          </div>
        }

        {/* For testing - Will be removed */}
        {this.state.temp_tip &&
          <div className='home-page-temp-tip'>
            <div style={{ color: 'yellow' }}>MAKE SURE TO GET YOUR PROCESS:</div>
            <div>Your process id is:</div>
            <div style={{ color: 'yellow' }}>{this.state.process}</div>
            <div>Try to run "aos PROCESS_ID_ABOVE --wallet PATH_WALLET_KEY.json".</div>
            <div>And see the handlers via "Handlers.list" in a termianl.</div>
            <button style={{ width: '150px' }} onClick={() => this.setState({ temp_tip: false })}>Close</button>
          </div>
        }

        {this.state.loadNextPage && <Loading />}

        {this.state.profile &&
          <EditProfileModal
            open={this.state.openEditProfile}
            onClose={this.onCloseEditProfile}
            data={this.state.profile[0]}
          />
        }

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default HomePage;