import { byteArraysAreEqual } from "@/utils/byteArray";
import {
  CodecComponentType,
  CodecComponentValue,
} from "@polkadot-api/react-builder";
import { state, useStateObservable } from "@react-rxjs/core";
import { Codec } from "polkadot-api";
import { ComponentProps, FC, useEffect, useRef, useState } from "react";
import { map } from "rxjs";
import {
  Marker,
  MarkersContextProvider,
  VisibleWindow,
} from "../common/Markers";
import { synchronizeScroll } from "../common/scroll";
import { SubtreeFocus } from "../common/SubtreeFocus";
import { EditCodec } from "../EditCodec";
import { TreeCodec } from "../EditCodec/Tree";
import { BinaryDisplay } from "./BinaryDisplay";
import { FocusPath } from "./FocusPath";

export const LookupTypeEdit: FC<{
  type: number;
  value: Uint8Array | "partial" | null;
  onValueChange: (value: Uint8Array | "partial" | null) => void;
  tree?: boolean;
}> = ({ type, value, onValueChange, tree = true }) => null as any;
