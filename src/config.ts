import { generateSecretKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { Signer } from './utils.js';

export const relayUrls: string[] = ['wss://relay.nostr.wirednet.jp/', 'wss://yabu.me/'];

export const mahjongChannelId: string = 'c8d5c2709a5670d6f621ac8020ac3e4fc3057a4961a15319f7c0818309407723';

export const mahjongServerPubkey: string = '93e68a5f7bf6d35f0cb1288160e42ecdb3396b80bb686a528199dfc5e58ceb25';

const mahjongPlayerNsecs: string[] = [
  nip19.nsecEncode(generateSecretKey()), //nsec1...
  nip19.nsecEncode(generateSecretKey()),
  nip19.nsecEncode(generateSecretKey()),
  nip19.nsecEncode(generateSecretKey()),
];

export const getPlayerSignerMap = (): Map<string, Signer> => {
  return getSignerMap(mahjongPlayerNsecs);
};

const getSignerMap = (nsecs: string[]): Map<string, Signer> => {
  const m = new Map<string, Signer>();
  for (const nsec of nsecs) {
    const dr = nip19.decode(nsec);
    if (dr.type !== 'nsec') {
      throw Error(`${nsec} is not nsec`);
    }
    const seckey: Uint8Array = dr.data;
    const signer = new Signer(seckey);
    m.set(signer.getPublicKey(), signer);
  }
  return m;
};
