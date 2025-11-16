import React, { useState } from "react";
import Svg, { Path, Rect } from "react-native-svg";

export type PanelStatus = "normal" | "repaired" | "replaced" | "damaged";

export type StatusMap = Partial<Record<
  | "hood"
  | "roof"
  | "trunk"
  | "front_panel"
  | "rear_panel"
  | "front_fender_left"
  | "front_fender_right"
  | "rear_quarter_left"
  | "rear_quarter_right"
  | "front_door_left"
  | "front_door_right"
  | "rear_door_left"
  | "rear_door_right"
  | "pillar_a_left"
  | "pillar_a_right"
  | "pillar_b_left"
  | "pillar_b_right"
  | "pillar_c_left"
  | "pillar_c_right"
  | "floor"
, PanelStatus>>;

const STATUS_COLORS: Record<PanelStatus, string> = {
  normal: "#CFCFCF",
  repaired: "#FFC107",
  replaced: "#2196F3",
  damaged: "#F44336",
};

interface Props {
  statusByPart?: StatusMap;
  size?: number;
  onSelect?: (id: string, status: PanelStatus) => void;
}

const VehicleDamageMapRN: React.FC<Props> = ({
  statusByPart = {},
  size = 300,
  onSelect,
}) => {
  const partStatus = (id: keyof StatusMap): PanelStatus =>
    statusByPart[id] ?? "normal";

  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 1000 500">
      <Rect x={80} y={60} width={840} height={380} rx={40} stroke="#555" strokeWidth={2} fill="#f8f9fb" />
      <Rect x={40} y={120} width={40} height={260} rx={10} fill="#EEF1F6" stroke="#555" />
      <Rect x={920} y={120} width={40} height={260} rx={10} fill="#EEF1F6" stroke="#555" />

      <TouchPart id="hood" d="M120 80 H 340 V 420 H 120 Z" status={partStatus("hood")} onSelect={onSelect} />
      <TouchPart id="front_panel" d="M340 80 H 370 V 420 H 340 Z" status={partStatus("front_panel")} onSelect={onSelect} />
      <TouchPart id="rear_panel" d="M630 80 H 660 V 420 H 630 Z" status={partStatus("rear_panel")} onSelect={onSelect} />
      <TouchPart id="trunk" d="M660 80 H 880 V 420 H 660 Z" status={partStatus("trunk")} onSelect={onSelect} />
      <TouchPart id="roof" d="M370 120 H 630 V 380 H 370 Z" status={partStatus("roof")} onSelect={onSelect} />
      <TouchPart id="floor" d="M370 220 H 630 V 280 H 370 Z" status={partStatus("floor")} opacity={0.35} onSelect={onSelect} />

      <TouchPart id="front_fender_left" d="M120 80 H 220 V 180 H 120 Z" status={partStatus("front_fender_left")} onSelect={onSelect} />
      <TouchPart id="front_fender_right" d="M120 320 H 220 V 420 H 120 Z" status={partStatus("front_fender_right")} onSelect={onSelect} />

      <TouchPart id="rear_quarter_left" d="M780 80 H 880 V 180 H 780 Z" status={partStatus("rear_quarter_left")} onSelect={onSelect} />
      <TouchPart id="rear_quarter_right" d="M780 320 H 880 V 420 H 780 Z" status={partStatus("rear_quarter_right")} onSelect={onSelect} />

      <TouchPart id="front_door_left" d="M370 140 H 480 V 240 H 370 Z" status={partStatus("front_door_left")} onSelect={onSelect} />
      <TouchPart id="rear_door_left" d="M520 140 H 630 V 240 H 520 Z" status={partStatus("rear_door_left")} onSelect={onSelect} />
      <TouchPart id="front_door_right" d="M370 260 H 480 V 360 H 370 Z" status={partStatus("front_door_right")} onSelect={onSelect} />
      <TouchPart id="rear_door_right" d="M520 260 H 630 V 360 H 520 Z" status={partStatus("rear_door_right")} onSelect={onSelect} />

      <TouchPart id="pillar_a_left" d="M360 120 H 370 V 190 H 360 Z" status={partStatus("pillar_a_left")} onSelect={onSelect} />
      <TouchPart id="pillar_a_right" d="M360 310 H 370 V 380 H 360 Z" status={partStatus("pillar_a_right")} onSelect={onSelect} />
      <TouchPart id="pillar_b_left" d="M490 120 H 500 V 190 H 490 Z" status={partStatus("pillar_b_left")} onSelect={onSelect} />
      <TouchPart id="pillar_b_right" d="M490 310 H 500 V 380 H 490 Z" status={partStatus("pillar_b_right")} onSelect={onSelect} />
      <TouchPart id="pillar_c_left" d="M620 120 H 630 V 190 H 620 Z" status={partStatus("pillar_c_left")} onSelect={onSelect} />
      <TouchPart id="pillar_c_right" d="M620 310 H 630 V 380 H 620 Z" status={partStatus("pillar_c_right")} onSelect={onSelect} />
    </Svg>
  );
};

export default VehicleDamageMapRN;

const TouchPart = ({
  id,
  d,
  status,
  opacity,
  onSelect,
}: {
  id: string;
  d: string;
  status: PanelStatus;
  opacity?: number;
  onSelect?: (id: string, status: PanelStatus) => void;
}) => {
  return (
    <Path
      d={d}
      fill={STATUS_COLORS[status]}
      fillOpacity={opacity ?? 1}
      stroke="#444"
      strokeWidth={1}
      onPress={() => onSelect?.(id, status)}
    />
  );
};

export const Demo = () => {
  const [map, setMap] = useState<StatusMap>({ hood: "repaired" });
  const order: PanelStatus[] = ["normal", "repaired", "replaced", "damaged"];

  return (
    <VehicleDamageMapRN
      statusByPart={map}
      onSelect={(id, status) => {
        const next = order[(order.indexOf(status) + 1) % order.length];
        setMap((prev) => ({ ...prev, [id]: next }));
      }}
    />
  );
};
