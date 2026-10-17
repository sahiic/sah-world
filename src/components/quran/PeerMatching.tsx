"use client";
import PeerMatchingView, {
  type PeerMatchingProps,
} from "./peer/PeerMatchingView";
export default function PeerMatching(props: PeerMatchingProps) {
  return (
    <PeerMatchingView key={`${props.userId}:${props.realUser}`} {...props} />
  );
}
