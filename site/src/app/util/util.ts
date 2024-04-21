import { createDataItemSigner, dryrun, message, spawn } from "@permaweb/aoconnect/browser";
import { MINI_SOCIAL, ARWEAVE_GATEWAY, MODULE, SCHEDULER } from "./consts";
import { Server } from "../../server/server";
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

declare var window: any;

/**
 * check the input if is a valid number
 * @param value 
 * @returns 
 */
export function checkNumber(value: string) {
  const regex = /^[0-9]*$/; // 0-9 number

  if (regex.test(value)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Format time to twitter style ones
 * @param time timestamp in seconds
 * @param ago the 'ago' suffix 
 * @returns the time formatted
 */
export function formatTimestamp(time: number, ago?: boolean) {

  const m = new Map([[1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
  [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec']]);

  let now = secondsOfNow();
  let diff = now - time;

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = Math.floor(diff % 60);

  if (days > 0) {
    const date = new Date(time * 1000);

    if (days > 365) {
      return date.toLocaleString();
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return m.get(month) + ' ' + day;
    }
  }

  if (hours > 0) {
    let t = hours + 'h';
    if (ago) t += ' ago';
    return t;
  }

  if (minutes > 0) {
    let t = minutes + 'm';
    if (ago) t += ' ago';
    return t;
  }

  if (seconds > 0) {
    let t = seconds + 's';
    if (ago) t += ' ago';
    return t;
  }

  return 'just now';
};

/**
 * Gets the time value of now in milliseconds.
 * @returns the time value in milliseconds
 */
export function msOfNow() {
  return new Date().getTime();
}

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
export function secondsOfNow() {
  return Math.floor(new Date().getTime() / 1000);
}

/**
 * Gets the unique id.
 * @returns the unique id
 */
export function uniqueId() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Generate a random number between min and max, including both min and max.
 * @param min 
 * @param max 
 * @returns the integer
 */
export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getAssetImage(asset: any): string {
  let image = asset.image;
  if (!image)
    image = asset.id;
  return '/assets/' + image + '.png';
}

export function getPortraitImage(profile: any): string {
  let image = profile ? profile.portrait : null;
  if (!image)
    image = '/portrait-default.png';
  return image;
}

export function getBannerImage(profile: any): string {
  let image = profile ? profile.banner : null;
  if (!image)
    image = '/banner-default.png';
  return image;
}

export function getMenuIcon(name: string): string {
  return '/' + name + '.png';
}

/**
 * Convert the url in the str to link
 * @param str
 * @returns 
 */
export function urlToLink(str: string): any {
  const re = /(f|ht){1}(tp|tps):\/\/([\w-]+\S)+[\w-]+([\w-?%#&=]*)?(\/[\w- ./?%#&=]*)?/g;

  str = str.replace(re, function (url) {
    return `<a href=${url} target="_blank" style="color: white">${url}</a>`;
  });

  return { __html: str };
}

export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * get amount of media file from the Quill editor content
 * @param quillRef 
 * @returns 
 */
export function getMediaAmount(quillRef: any) {
  let mediaAmount = 0;
  let html = quillRef.root.innerHTML;
  let img = html.match(/<img/gi);
  let iframe = html.match(/<iframe/gi);
  let audio = html.match(/<audio/gi);
  mediaAmount += img && img.length;
  mediaAmount += iframe && iframe.length;
  mediaAmount += audio && audio.length;

  return mediaAmount;
}

/**
 * Convert the substr which start with @ to user slug
 * @param str
 * @returns 
 */
export function convertSlug(str: string): any {
  const pattern = /@\w+(-\w+)*/g;
  str = str.replace(pattern, function (slug) {
    return `<a className='activity-page-slug-link' href='/profile/${slug.substring(1)}' id="url-${slug}">${slug}</a>`;
  });

  return str;
}

/**
 * Convert the substr which start with # to hash tag
 * @param str
 * @returns 
 */
export function convertHashTag(str: string): any {
  const pattern = /#\w+(-\w+)*/g;
  str = str.replace(pattern, function (hashtag) {
    return `<a className='activity-page-slug-link' href='/plan/${hashtag.substring(1)}' id="url-${hashtag}">${hashtag}</a>`;
  });

  return str;
}

/**
 * Convert the URLs that are not within a tag to link.
 * @param str original string
 * @returns 
 */
export function convertUrls(str: string): string {
  // match all of URLs
  const urlRegex = /(f|ht){1}(tp|tps):\/\/([\w-]+\S)+[\w-]+([\w-?%#&=]*)?(\/[\w- ./?%#&=]*)?/g;

  // match all of <a> tag content
  const hrefRegex = /<a\s+[^>]*?href\s*=\s*(['"])(.*?)\1/g;
  const hrefs = str.match(hrefRegex);

  // match all of img tag content
  const imgSrcRegex = /<img.*?src="(.*?)".*?>/g;
  const imgSrcs = str.match(imgSrcRegex);

  // match all of audio tag content
  const audioSrcRegex = /<audio.*?src="(.*?)"/g;
  const audioSrcs = str.match(audioSrcRegex);

  // match all of iframe tag content
  const iframeSrcRegex = /<iframe.*?src="(.*?)"/g;
  const iframeSrcs = str.match(iframeSrcRegex);

  // repalce all of URLs while ignoring URLs that are already within an <a>, <img> or <audio> tag.
  const convertedText = str.replace(urlRegex, (url) => {
    if (hrefs && hrefs.includes(`<a href="${url}"`))
      return url;
    else if (imgSrcs && imgSrcs.includes(`<img src="${url}">`))
      return url;
    else if (audioSrcs && audioSrcs.includes(`<audio src="${url}"`))
      return url;
    else if (iframeSrcs && iframeSrcs.includes(`<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${url}"`))
      return url;
    else
      return `<a href=${url} target="_blank" id="url-${url}">${url}</a>`;
  });

  return convertedText;
}

export function isValidUrl(url: string) {
  var pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return pattern.test(url);
}

/**
 * Find the first text line in the string
 * @param str 
 * @returns the first text line
 */
export function getFirstLine(str: any) {
  let text = '';
  let start = str.indexOf('<p>');

  if (start != -1) {
    let end = str.indexOf('</p>', start);
    if (end != -1)
      text = str.substring(start + 3, end);
  }

  return text.substring(0, 100);
}

/**
 * Find the first image in the string
 * @param str 
 * @returns the image in base64
 */
export function getFirstImage(str: any) {
  let image = '';
  let start = str.indexOf('<img');

  if (start != -1) {
    let end = str.indexOf('>', start);
    if (end != -1)
      image = str.substring(start + 10, end - 1);
  }

  return image;
}

/**
 * browserDetect
 * @returns browserName
 */
export function browserDetect() {
  let userAgent = navigator.userAgent;
  let browserName;

  // Approach 1
  // if (userAgent.match(/chrome|chromium|crios/i)) {
  //   browserName = "chrome";
  // } else if (userAgent.match(/firefox|fxios/i)) {
  //   browserName = "firefox";
  // } else if (userAgent.match(/safari/i)) {
  //   browserName = "safari";
  // } else if (userAgent.match(/opr\//i)) {
  //   browserName = "opera";
  // } else if (userAgent.match(/edg/i)) {
  //   browserName = "edge";
  // } else {
  //   browserName="other browser";
  // }

  // Approach 2
  // CHROME
  if (userAgent.indexOf("Chrome") != -1) {
    console.log("Google Chrome");
    browserName = "chrome";
  }
  // FIREFOX
  else if (userAgent.indexOf("Firefox") != -1) {
    console.log("Mozilla Firefox");
    browserName = "firefox";
  }
  // INTERNET EXPLORER
  else if (userAgent.indexOf("MSIE") != -1) {
    console.log("Internet Exploder");
    browserName = "ie";
  }
  // EDGE
  else if (userAgent.indexOf("Edge") != -1) {
    console.log("Internet Edge");
    browserName = "edge";
  }
  // SAFARI
  else if (userAgent.indexOf("Safari") != -1) {
    console.log("Safari");
    browserName = "safari";
  }
  // OPERA
  else if (userAgent.indexOf("Opera") != -1) {
    console.log("Opera");
    browserName = "opera";
  }
  // YANDEX BROWSER
  else if (userAgent.indexOf("YaBrowser") != -1) {
    console.log("YaBrowser");
    browserName = "yandex";
  }
  // Brave - TODO: need to test and update
  else if (userAgent.indexOf("Brave") != -1) {
    console.log("Brave");
    browserName = "brave";
  }
  // OTHERS
  else {
    console.log("Others");
    browserName = "others";
  }

  return browserName;
}

export function getTimestamp(exDays: number, hour: number) {
  let now = new Date(); // Date object for now
  let year = now.getFullYear(); // Get the current year
  let month = now.getMonth(); // Get the current month (note: the month starts from 0, and 0 means January)
  let day = now.getDate(); // get current date
  let result = new Date(year, month, day + exDays, hour, 0, 0); // Create a Date object at the hour of the specified day

  return result.getTime(); // Returns the timestamp (in milliseconds) at the hour of the specified day
}

export function checkContent(quillRef: any, wordCount: number) {
  let message = '';
  let mediaAmount = getMediaAmount(quillRef);
  if (mediaAmount > 1)
    return 'Contains up to 1 media file.';

  if (wordCount == 0 && mediaAmount == 0)
    message = 'Post is empty.';
  else if (wordCount > 500)
    message = 'Content can be up to 500 characters long.';

  return message;
}

export function capitalizeFirstLetter(str: string) {
  return str.replace(/^\w/, c => c.toUpperCase());
}

/**
 * Gets a uuid.
 * @returns the unique uuid
 */
export function uuid() {
  var str = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return str.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the timestamp of now in seconds
 * @returns Timestamp of now in seconds
 */
export function timeOfNow() {
  let now = Math.floor(Date.now() / 1000);
  return now;
  // return now.toString();
}

export async function spawnProcess() {
  try {
    const processId = await spawn({
      module: MODULE,
      scheduler: SCHEDULER,
      signer: createDataItemSigner(window.arweaveWallet),
      tags: [{ name: 'Name', value: 'ms-personal' }]
    });

    return processId;
  } catch (error) {
    console.log("spawnProcess --> error:", error)
    return '';
  }
}

/**
 * Load the lua code into users process
 * @param process 
 * @param data 
 * @returns 
 */
export async function evaluate(process: string, data: string) {
  try {
    const messageId = await message({
      process,
      signer: createDataItemSigner(window.arweaveWallet),
      tags: [{ name: 'Action', value: 'Eval' }],
      data
    });

    return messageId;
  } catch (error) {
    console.log("evaluate --> error:", error)
    return '';
  }
}

export async function messageToAO(process: string, data: any, action: string) {
  try {
    const messageId = await message({
      process: process,
      signer: createDataItemSigner(window.arweaveWallet),
      tags: [{ name: 'Action', value: action }],
      data: JSON.stringify(data)
    });

    console.log("messageId:", messageId)
    return messageId;
  } catch (error) {
    console.log("messageToAO -> error:", error)
    return '';
  }
}

// export async function getDataFromAO(
//   process: string,
//   action: string,
//   pageNo?: number,
//   pageSize?: string,
//   postId?: string,
//   address?: string,
// ) {

//   let start = performance.now();
//   // console.log('==> [getDataFromAO]');

//   let valPN = '', valPS = '', valPID = '', valAddress = '';
//   if (pageNo) valPN = pageNo.toString();
//   if (pageSize) valPS = pageSize;
//   if (postId) valPID = postId;
//   if (address) valAddress = address;

//   let result;
//   try {
//     result = await dryrun({
//       process: process,
//       tags: [
//         { name: 'Action', value: action },
//         { name: 'pageNo', value: valPN },
//         { name: 'pageSize', value: valPS },
//         { name: 'postId', value: valPID },
//         { name: 'address', value: valAddress },
//       ],
//     });
//   } catch (error) {
//     // console.log('getDataFromAO --> ERR:', error)
//     return '';
//   }

//   // console.log('action', action);
//   // console.log('result', result);

//   try {
//     if (result.Messages.length == 0) return '';
//   } catch (error) {
//     return '';
//   }

//   let data = result.Messages[0].Data;
//   if (!data) return '';
//   let final = data.split("▲");

//   let end = performance.now();
//   // console.log(`<== [getDataFromAO] [${Math.round(end - start)} ms]`);

//   if (final.length == 1 && final[0] == '') return '';
//   return final;
// }

// NOTE: worth to try to pass a json parameter to ao like this
// param = { offset: '0', postId: '123', address: '0x123' }
// result = await dryrun({
//   process: process,
//   data: JSON.stringif(param),
//   tags: [
//     { name: 'Action', value: action },
//   ],
// });
export async function getDataFromAO(
  process: string,
  action: string,
  offset?: string,
  postId?: string,
  address?: string,
) {
  
  let start = performance.now();
  // console.log('==> [getDataViaSQLite]');

  let result;
  try {
    result = await dryrun({
      process: process,
      tags: [
        { name: 'Action', value: action },
        { name: 'offset', value: offset ? offset : '0' },
        { name: 'postId', value: postId ? postId : '' },
        { name: 'address', value: address ? address : '' },
      ],
    });
  } catch (error) {
    console.log('getDataViaSQLite --> ERR:', error)
    return '';
  }

  // console.log('action', action);
  // console.log('result', result);

  let data = result.Messages[0].Data;

  let end = performance.now();
  // console.log(`<== [getDataViaSQLite] [${Math.round(end - start)} ms]`);

  return JSON.parse(data);
}

// check the state of bookmark
export function isBookmarked(bookmarks: any, id: string) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (id == bookmarks[i].id) return true
  }

  return false;
}

export async function connectWallet() {
  try {
    // connect to the ArConnect browser extension
    await window.arweaveWallet.connect(
      // request permissions
      ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
    );
  } catch (error) {
    alert('You should connect to ArConnect browser extension.');
    return false;
  }

  return true;
}

export async function getWalletAddress() {
  let address;
  try {
    address = await window.arweaveWallet.getActiveAddress();
  } catch (error) {
    return '';
  }

  return address;
}

export async function isLoggedIn() {
  let address = await getWalletAddress();
  if (address)
    return address;
  else
    return '';
}

export async function fetchGraphQL(queryObject: any) {
  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify(queryObject),
  });

  const data = await response.json();
  // console.log("==> data:", data)
  return data.data.transactions.edges;
}

export async function getDefaultProcess(owner: string) {
  let start = performance.now();
  // console.log('==> [getDefaultProcess]');

  const queryObject = {
    query:
      `{
        transactions (
          first: 1
          owners: "${owner}"
          tags: [
            { name: "Data-Protocol", values: ["ao"] },
            { name: "Type", values: ["Process"] },
            { name: "Name", values: ["ms-personal"]}
          ]
        ) {
          edges {
            node {
              id
            }
          }
        }
      }`
  };

  try {
    let response = await fetchGraphQL(queryObject);

    let end = performance.now();
    // console.log(`<== [getDefaultProcess] [${Math.round(end - start)} ms]`);

    if (response.length == 0)
      return '';
    else
      return response[0].node.id;
  } catch (error) {
    console.log("getDefaultProcess -> ERR:", error);
    return '';
  }
}

export async function downloadFromArweave(txid: string) {
  let url = ARWEAVE_GATEWAY + txid;
  let resp = await fetch(url);
  let data = await resp.json();
  return data;
}

export function parsePosts(posts: any) {
  let result = [];
  for (let i = posts.length - 1; i >= 0; i--) {
    let data;
    try {
      data = JSON.parse(posts[i]);
      Server.service.addPostToCache(data);
    } catch (error) {
      continue;
    }

    result.push(data)
  }

  return result;
}

export function storePostInLocal(post: any) {
  let list = [];
  let val = localStorage.getItem('your_posts');
  if (val) list = JSON.parse(val);
  list.unshift(post);

  localStorage.setItem('your_posts', JSON.stringify(list))
}

export async function getTokenBalance(process: string, address: string) {
  const result = await dryrun({
    process: process,
    tags: [
      { name: 'Action', value: 'Balance' },
      { name: 'Target', value: address },
    ],
  });

  return result.Messages[0].Data;
}

export async function transferToken(from: string, to: string, qty: string) {
  const messageId = await message({
    process: from,
    signer: createDataItemSigner(window.arweaveWallet),
    tags: [
      { name: 'Action', value: 'TransferAOT' },
      { name: 'Recipient', value: to },
      { name: 'Quantity', value: qty },
    ],
  });

  console.log("transferToken:", messageId)
  return messageId;
}

export function randomAvatar() {
  const resp = createAvatar(micah, {
    seed: uuid(),
  });
  return resp.toDataUriSync();
}

export async function getProfile(address: string) {
  return await getDataFromAO(MINI_SOCIAL, 'GetProfile', '0', '', address);
}