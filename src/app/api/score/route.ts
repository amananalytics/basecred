import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE = "https://api.neynar.com/v2";

async function getFarcasterUser(username: string) {
  const res = await axios.get(`${NEYNAR_BASE}/farcaster/user/by_username`, {
    params: { username },
    headers: { api_key: NEYNAR_API_KEY },
  });
  return res.data.user;
}

async function getUserCasts(fid: number) {
  const res = await axios.get(`${NEYNAR_BASE}/farcaster/feed/user/casts`, {
    params: { fid, limit: 25 },
    headers: { api_key: NEYNAR_API_KEY },
  });
  return res.data.casts;
}

function scoreCastQuality(casts: any[]): number {
  if (!casts || !casts.length) return 0;
  const total = casts.reduce((acc, cast) => {
    const likes = cast.reactions?.likes_count || 0;
    const recasts = cast.reactions?.recasts_count || 0;
    const replies = cast.replies?.count || 0;
    return acc + likes * 1.5 + recasts * 2 + replies * 1;
  }, 0);
  return Math.min(200, Math.floor(total / casts.length * 4));
}

function scoreSocialConsistency(user: any): number {
  const followers = user.follower_count || 0;
  const following = user.following_count || 0;
  const ratio = following > 0 ? followers / following : 0;
  const followerScore = Math.min(100, Math.floor(Math.log10(followers + 1) * 30));
  const ratioScore = Math.min(100, Math.floor(ratio * 20));
  return Math.min(200, followerScore + ratioScore);
}

function scoreBuilderSignal(user: any): number {
  const bio = user.profile?.bio?.text || "";
  const keywords = ["dev", "build", "engineer", "code", "solidity", "founder", "protocol", "web3", "contract", "hack"];
  const matches = keywords.filter(k => bio.toLowerCase().includes(k)).length;
  const verifications = user.verifications?.length || 0;
  return Math.min(200, matches * 20 + verifications * 40);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.replace("@", "");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const user = await getFarcasterUser(username);
    const casts = await getUserCasts(user.fid);

    const castQuality = scoreCastQuality(casts);
    const socialConsistency = scoreSocialConsistency(user);
    const builderSignal = scoreBuilderSignal(user);
    const onchainActivity = Math.min(200, (user.verifications?.length || 0) * 60 + 20);
    const communityContribution = Math.min(200, Math.floor(user.follower_count / 10));

    const scores = [
      { label: "Cast Quality", desc: "Engagement · Reply depth · Recasts", score: castQuality, max: 200, icon: "◈" },
      { label: "Onchain Activity", desc: "Txns · Contract calls · Base usage", score: onchainActivity, max: 200, icon: "⬡" },
      { label: "Social Consistency", desc: "Frequency · Streak · Account age", score: socialConsistency, max: 200, icon: "◎" },
      { label: "Community Contribution", desc: "Tipping · Mini Apps · DAO votes", score: communityContribution, max: 200, icon: "◇" },
      { label: "Builder Signal", desc: "GitHub · Contracts · Mini Apps built", score: builderSignal, max: 200, icon: "△" },
    ];

    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.display_name,
        avatar: user.pfp_url,
        fid: user.fid,
        followers: user.follower_count,
        following: user.following_count,
      },
      scores,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data?.message || "User not found" },
      { status: 404 }
    );
  }
}