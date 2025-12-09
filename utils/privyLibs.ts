// @ts-ignore - Module not installed yet
import { PrivyClient } from "@privy-io/server-auth";
import { PRIVY_APP_SECRET, PRIVY_APP_ID, PRIVY_AUTHORIZATION_KEY } from "../config/env.js";

const privy = new PrivyClient(PRIVY_APP_ID as string, PRIVY_APP_SECRET as string, {
    walletApi: {
        authorizationPrivateKey: PRIVY_AUTHORIZATION_KEY as string,
    },
});

export default privy;
