export const MINI_SOCIAL = "Uew2frmpZ_tlvgc12PAWENUXleMoc6eAvcGutFFTZ-s";
export const AO_STORY = "Ur_5hhtX6zQEpFg9jPzFULMTLRvkBfp4bn7Od4Qj4Jk";
export const STORY_INCOME = "LsNy8F1GSkGvE0IJ6g1RFpHHjKE6tmtXUT91WIv3PMQ";
export const CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc";
export const AOT_TEST = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
export const CHATROOM = "F__i_YGIUOGw43zyqLY9dEKNNEhB_uTqzL9tOTWJ-KA";
export const TIP_IMG = "Is there a picture in the post? Size just up to 100KB for now.";
export const ICON_SIZE = 28;
export const PAGE_SIZE = "10";

// export const MODULE = "Kb9_Qnn_Ih5bLE5J8XnCXKatwxriS8ZGFfeEZFu1fjw"
// export const SCHEDULER = "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog"
// export const MODULE = "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk"

// AOS_MODULE for AO SQLite
export const MODULE = "GYrbbe0VbHim_7Hi6zrOpHQXrSQz07XNtwCnfbFo2I0"
export const SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"

export const ARWEAVE_GATEWAY = "https://arweave.net/";

export const LUA =
  `
  AOT_TEST = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
  
  Bookmarks  = Bookmarks or {}
  Profile    = Profile or {}
  
  Handlers.add("ms.setBookmark",
    Handlers.utils.hasMatchingTag("Action", "ms.setBookmark"),
    function(msg)
      print("Setting a bookmark")
      Bookmarks = msg.Data
      -- table.insert(Bookmarks, msg.Data)
    end
  )
  
  Handlers.add("ms.getBookmarks",
    Handlers.utils.hasMatchingTag("Action", "ms.getBookmarks"),
    function(msg)
      print("Get bookmarks")
      Handlers.utils.reply(table.concat(Bookmarks, "▲"))(msg)
    end
  )
  
  Handlers.add("ms.setProfile",
    Handlers.utils.hasMatchingTag("Action", "ms.setProfile"),
    function(msg)
      print("Setting the profile")
      Profile = msg.Data
    end
  )
  
  Handlers.add("ms.getProfile",
    Handlers.utils.hasMatchingTag("Action", "ms.getProfile"),
    function(msg)
      print("Get the profile")
      Handlers.utils.reply(Profile)(msg)
    end
  )
  
  Handlers.add(
    "ms.transferAOT",
    Handlers.utils.hasMatchingTag("Action", "ms.transferAOT"),
    function(msg)
      if msg.From == Owner then
        ao.send({
          Target = AOT_TEST,
          Action = "Transfer",
          Recipient = msg.Tags.Recipient,
          Quantity = msg.Tags.Quantity
        })
      end
    end
  )
`;