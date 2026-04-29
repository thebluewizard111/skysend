import type { MissionHub } from "@/types/mission";

export type OperationalHubStatus = "active" | "inactive";

export type OperationalHub = MissionHub & {
  status: OperationalHubStatus;
  description: string;
};

export const pitestiHub: OperationalHub = {
  id: "hub_pitesti_001",
  name: "SkySend Pitești Hub",
  status: "active",
  description:
    "Primary SkySend operations hub for live drone dispatch, locker preparation and mission recovery in Pitești.",
  address: {
    formattedAddress: "SkySend Pitești Hub, Pitești, Argeș, România",
    city: "Pitești",
    county: "Argeș",
    country: "România",
    location: {
      latitude: 44.8565,
      longitude: 24.8692,
    },
  },
};

export const activeHub = pitestiHub;

