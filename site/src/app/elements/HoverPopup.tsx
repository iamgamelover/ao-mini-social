import React from 'react';
import './HoverPopup.css';

interface HoverPopupProps {
  data: any;
  // popupRef: any;
}

interface HoverPopupState {
}

class HoverPopup extends React.Component<HoverPopupProps, HoverPopupState> {
  render() {
    let user = this.props.data;
    return (
      // <div className="hover-popup" ref={this.props.popupRef}>
      <div className="hover-popup">
        <div className='hover-popup-header'>
          <img className='hover-popup-avatar' src={user.avatar} />
          <div className='hover-popup-button'>Follow</div>
        </div>
        <div className='hover-popup-nickname'>{user.nickname}</div>
        <div className='hover-popup-bio'>{user.address}</div>
        <div className='hover-popup-bio'>{user.bio}</div>
      </div>
    );
  }
}

export default HoverPopup;