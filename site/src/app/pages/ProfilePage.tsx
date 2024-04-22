import React from 'react';
import './ProfilePage.css';
import AlertModal from '../modals/AlertModal';
import EditProfileModal from '../modals/EditProfileModal';
import MessageModal from '../modals/MessageModal';
import QuestionModal from '../modals/QuestionModal';
import { getBannerImage, getDataFromAO, getDefaultProcess, getProfile, isBookmarked, isLoggedIn, messageToAO, parsePosts, randomAvatar, timeOfNow } from '../util/util';
import { BsCalendarWeek, BsPencilFill } from 'react-icons/bs';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { MINI_SOCIAL, PAGE_SIZE } from '../util/consts';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';
import ActivityPost from '../elements/ActivityPost';
import { subscribe } from '../util/event';
import Logo from '../elements/Logo';
import { CiMail } from "react-icons/ci";

declare var window: any;

interface ProfilePageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  isLoggedIn: string;
  address: string;
  openEditProfile: boolean;
  nickname: string;
  banner: string;
  avatar: string;
  bio: string;
  joined: string;
  posts: any;
  isAll: boolean;
  profile: any;
  followers: number;
  following: number;
  isFollowing: boolean;
  showUnfollow: boolean;
  butDisable: boolean;
  isFriend: boolean;
}

class ProfilePage extends React.Component<{}, ProfilePageState> {

  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      question: '',
      alert: '',
      message: '',
      loading: true,
      loadNextPage: false,
      isLoggedIn: '',
      address: '',
      openEditProfile: false,
      nickname: '',
      banner: '/banner-default.png',
      avatar: '',
      bio: '',
      joined: '',
      posts: '',
      isAll: false,
      profile: '',
      followers: 0,
      following: 0,
      isFollowing: false,
      showUnfollow: false,
      butDisable: true,
      isFriend: false,
    };

    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);
    this.atBottom = this.atBottom.bind(this);
    this.onPopState = this.onPopState.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);

    // subscribe('profile', () => {
    //   this.forceUpdate();
    //   this.start();
    // });
  }

  componentDidMount() {
    this.start();
    window.addEventListener('scroll', this.atBottom);
    window.addEventListener('popstate', this.onPopState);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
    window.removeEventListener('popstate', this.onPopState);
    Server.service.addPositionInProfileToCache(window.pageYOffset);
  }

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight)
      if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
        this.nextPage();
  }

  onPopState(event: any) {
    this.start();
  }

  async start() {
    let id = window.location.pathname.substring(6);
    console.log("id:", id)

    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address: id });

    // this.getDateOfJoined(address);
    await this.getPosts(id);
    await this.getProfile(id);
    await this.isFollowing();
    await this.getFollows();
    await this.tempGetFollowsTable();

    // let profile = JSON.parse(localStorage.getItem('profile'));
    // if (profile) {
    //   this.setState({
    //     banner: profile.banner,
    //     avatar: profile.avatar,
    //     nickname: profile.nickname,
    //     bio: profile.bio,
    //   });
    // }
    // else {
    //   // the avatar from dicebear.com
    //   this.createAvatar();
    //   this.getProfile(address);
    // }
  }

  async getPosts(address: string) {
    let posts;
    // let val = localStorage.getItem('your_posts');
    // if (val && val != '[]') posts = JSON.parse(val);
    // let posts = Server.service.getPostsInProfileFromCache(address);

    let position = Server.service.getPositionInProfileFromCache();

    if (!posts) {
      posts = await getDataFromAO(MINI_SOCIAL, 'GetPosts', '0', '', address);
      console.log("profile->posts:", posts)
      if (posts.length < PAGE_SIZE)
        this.setState({ isAll: true })

      // this.checkBookmarks(parsePosts(posts));
      // return;
    }

    this.checkBookmarks(posts);
    this.setState({ posts, loading: false });

    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let pageNo = Server.service.getPageNoInProfile();
    pageNo += 1;
    Server.service.setPageNoInProfile(pageNo);

    let posts = await getDataFromAO(MINI_SOCIAL, 'GetOwnerPosts');

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(parsePosts(posts));
    this.checkBookmarks(total);
  }

  async checkBookmarks(posts: any) {

    //
    let address = Server.service.getActiveAddress();
    for (let i = 0; i < posts.length; i++) {
      let isLiked = await getDataFromAO(MINI_SOCIAL, 'GetLike', '0', posts[i].id, address);
      console.log("post isLiked:", isLiked)
      if (isLiked.length > 0)
        posts[i].isLiked = true;
      // this.forceUpdate()
    }

    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    for (let i = 0; i < posts.length; i++) {
      let resp = isBookmarked(bookmarks, posts[i].id);
      posts[i].isBookmarked = resp;
    }

    this.setState({ posts, loading: false, loadNextPage: false });
    // Server.service.addPostsInProfileToCache(this.state.address, posts);
    // localStorage.setItem('your_posts', JSON.stringify(posts))
  }

  // load profile from the process of user's
  async getProfile(address: string) {
    let profile = await getProfile(address);
    console.log("profile:", profile)
    profile = profile[0];
    if (profile)
      this.setState({
        profile,
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      })

    // let process = await getDefaultProcess(address);
    // let response = await getDataFromAO(process, 'AOTwitter.getProfile');

    // let profile = {
    //   banner: this.state.banner,
    //   avatar: this.state.avatar,
    //   nickname: this.state.nickname,
    //   bio: this.state.bio,
    // };

    // if (response) {
    //   profile = JSON.parse(response[0]);
    //   this.setState({
    //     banner: profile.banner,
    //     avatar: profile.avatar,
    //     nickname: profile.nickname,
    //     bio: profile.bio,
    //   })
    // }

    // localStorage.setItem('profile', JSON.stringify(profile));
  }

  async getDateOfJoined(address: string) {
    let members = await getDataFromAO(MINI_SOCIAL, 'GetMembers');
    for (let i = 0; i < members.length; i++) {
      let data = JSON.parse(members[i]);
      if (data.address == address) {
        this.setState({ joined: data.time });
        return;
      }
    }
  }

  // createAvatar() {
  //   let nickname = localStorage.getItem('nickname');
  //   let random = localStorage.getItem('avatar');
  //   const resp = createAvatar(micah, {
  //     seed: nickname + random,
  //   });

  //   const avatar = resp.toDataUriSync();
  //   this.setState({ nickname, avatar });
  // }

  openEditProfile() {
    this.setState({ openEditProfile: true });
  }

  onCloseEditProfile() {
    // let profile = JSON.parse(localStorage.getItem('profile'));
    // if (profile) {
    //   this.setState({
    //     banner: profile.banner,
    //     avatar: profile.avatar,
    //     nickname: profile.nickname,
    //     bio: profile.bio,
    //   });
    // }

    this.setState({ openEditProfile: false });
    this.getProfile(this.state.address);
  }

  async follow() {
    if (this.state.butDisable) return;
    this.setState({ butDisable: true })

    let data = { following: this.state.address, follower: Server.service.getActiveAddress(), time: timeOfNow() }
    // console.log("follow data:", data)
    await messageToAO(MINI_SOCIAL, data, 'Follow');
    await this.isFollowing()

    this.setState({ butDisable: false })
    await this.getFollows();
  }

  async unfollow() {
    if (this.state.butDisable) return;
    this.setState({ butDisable: true })

    let data = { following: this.state.address, follower: Server.service.getActiveAddress() }
    // console.log("Unfollow data:", data)
    await messageToAO(MINI_SOCIAL, data, 'Unfollow');
    await this.isFollowing()

    this.setState({ butDisable: false })
    await this.getFollows();
  }

  async tempGetFollowsTable() {
    let tempGetFollowsTable = await getDataFromAO(MINI_SOCIAL, 'TempGetFollowsTable');
    console.log("tempGetFollowsTable:", tempGetFollowsTable)
  }

  async getFollows() {
    let following = await getDataFromAO(MINI_SOCIAL, 'GetFollowing', '0', this.state.address);
    console.log("following:", following)
    this.setState({ following: following.length })

    let followers = await getDataFromAO(MINI_SOCIAL, 'GetFollowers', '0', this.state.address);
    console.log("followers:", followers)
    this.setState({ followers: followers.length })
  }

  async isFollowing() {
    let isFollowing = await getDataFromAO(MINI_SOCIAL, 'GetFollowing', '0', Server.service.getActiveAddress(), this.state.address);
    console.log("isFollowing:", isFollowing)
    if (isFollowing.length > 0)
      this.setState({ isFollowing: true, butDisable: false })
    else
      this.setState({ isFollowing: false, butDisable: false })

    let isFollower = await getDataFromAO(MINI_SOCIAL, 'GetFollowing', '0', this.state.address, Server.service.getActiveAddress());
    console.log("isFollower:", isFollower)

    if (isFollowing.length > 0 && isFollower.length > 0)
      this.setState({ isFriend: true });
    else
      this.setState({ isFriend: false });
  }

  showUnfollow() {
    this.setState({ showUnfollow: true })
  }

  notShowUnfollow() {
    this.setState({ showUnfollow: false })
  }

  renderActionButtons() {
    if (this.state.loading)
      return (<div className="profile-page-button-container" style={{ height: '42px' }}></div>);

    if (this.state.address !== Server.service.getActiveAddress())
      return (
        <div className="profile-page-button-container">
          {this.state.isFriend &&
            <div onClick={this.openEditProfile} className="profile-page-action-button">
              <CiMail />
            </div>
          }

          {this.state.isFollowing
            ? <div
              className={`profile-page-follow-button ${this.state.showUnfollow ? 'unfollow' : 'following'}`}
              onMouseEnter={() => this.showUnfollow()}
              onMouseLeave={() => this.notShowUnfollow()}
              onClick={() => this.unfollow()}
            >
              {this.state.butDisable
                ? <Loading marginTop='10px' />
                : this.state.showUnfollow ? 'Unfollow' : 'Following'
              }
            </div>
            : <div className='profile-page-follow-button' onClick={() => this.follow()}>
              {this.state.butDisable
                ? <Loading marginTop='10px' />
                : 'Follow'
              }
            </div>
          }
        </div>
      )

    return (
      <div className="profile-page-button-container">
        <div onClick={this.openEditProfile} className="profile-page-follow-button following">
          Edit
        </div>
      </div>
    )
  }

  onFilter(index: number) {
    if (this.filterSelected === index) return;

    this.filterSelected = index;
    this.renderFilters();

    if (index === 0) { // Activity
      // this.setState({ posts: [] });
      // setTimeout(() => {
      //   this.getPosts(this.author);
      // }, 10);
    }
  }

  renderFilters() {
    let filters = ['Posts'];

    let divs = [];
    for (let i = 0; i < filters.length; i++) {
      divs.push(
        <div
          className={`profile-page-filter ${this.filterSelected == i ? 'selected' : ''}`}
          onClick={() => this.onFilter(i)} key={i}
        >
          {filters[i]}
        </div>
      );
    }

    return divs;
  }

  renderPosts() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(
        <ActivityPost
          key={i}
          data={this.state.posts[i]}
        />
      )

    return divs;
  }

  openUserList(str: string) {

  }

  render() {
    let joined = new Date(Number(this.state.joined) * 1000).toLocaleString();
    // let bannerImage = getBannerImage('');
    // let portraitImage = getPortraitImage(this.state.profile);

    let id = this.state.address;
    let shortId = id.substring(0, 6) + '...' + id.substring(id.length - 6);

    return (
      <div className='profile-page'>
        <Logo />

        <div className='profile-page-header'>
          <img className="profile-page-banner" src={this.state.banner ? this.state.banner : '/banner-default.png'} />
          <img className="profile-page-portrait" src={this.state.avatar ? this.state.avatar : randomAvatar()} />
        </div>

        {this.renderActionButtons()}

        <div className="profile-page-name">{this.state.nickname}</div>
        <div className="profile-page-id">{shortId}</div>
        <div className="profile-page-desc">{this.state.bio}</div>
        <div className='profile-page-joined-container'>
          <BsCalendarWeek />
          <div className='profile-page-joined'>Joined {joined}</div>
        </div>

        <div className='profile-page-follow-container'>
          <div className="profile-page-follow-link" onClick={() => this.openUserList('following')}>
            <div className='profile-page-follow-number'>{this.state.following}</div>
            <div className='profile-page-follow-text'>Following</div>
          </div>
          <div className="profile-page-follow-link" onClick={() => this.openUserList('followers')}>
            <div className='profile-page-follow-number'>{this.state.followers}</div>
            <div className='profile-page-follow-text'>Followers</div>
          </div>
        </div>

        <div className='profile-page-filter-container'>
          {this.renderFilters()}
        </div>

        {this.renderPosts()}

        {!this.state.loading && this.state.profile &&
          <EditProfileModal
            open={this.state.openEditProfile}
            onClose={this.onCloseEditProfile}
            data={this.state.profile}
          />
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more post.
          </div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
      </div>
    );
  }
}

export default ProfilePage;