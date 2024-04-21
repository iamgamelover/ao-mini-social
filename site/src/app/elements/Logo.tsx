import React from 'react';
import { NavLink } from 'react-router-dom';

class Logo extends React.Component {
  render() {
    return (
      <NavLink className='app-logo-line' to='/'>
        <img className='app-logo' src='/ao.png' />
        <div className='app-logo-text'>mini social</div>
      </NavLink>
    );
  }
}

export default Logo;