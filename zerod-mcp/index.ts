import { KiteConnect } from "kiteconnect";

const apiKey = Bun.env.API as string;
const accessToken = ""

const kc = new KiteConnect({ api_key: apiKey });

console.log(kc.getLoginURL())

async function init() {
  try {
    kc.setAccessToken(accessToken);
    await getProfile();
  } catch (err) {
    console.error(err);
  }
}


async function getProfile() {
  try {
    const profile = await kc.getProfile();
    console.log("Profile:", profile);
  } catch (err) {
    console.error("Error getting profile:", err);
  }
}
// Initialize the API calls
init();