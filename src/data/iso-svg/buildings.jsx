import React from 'react';
import { ensureDef } from './shared.jsx';
import { BUILDING_ART, PLACE_VIEWBOX, buildingArtDef, buildingArtId, buildingIconBox } from './buildings-art.js';

// 建物と、小さなもの（井戸・ベンチ・車など）
//
// 絵のおおもとは buildings-art.js・props-art.js にあり、はじめて描くときに 文書へ 1 回だけ置く
// （shared.jsx の ensureDef）。ここの部品は、それを <use> で呼びだすだけ（1 つ 2 要素）。

/**
 * 絵の名前から、町のアイテムの部品を作る。
 * 色ちがい（variants）のある絵は、置いた場所（seed）で どれにするかが決まる。
 *
 * place … 町のマスに置くとき（DraggableTownMap が付ける）。足もとが決まった場所に来る viewBox で描く。
 * 付けないとき（もちもの欄・クラフト・ガチャなどの見本）は、絵ぜんたいが わくに収まる viewBox で描く。
 */
const artOf = (name) => {
  const count = BUILDING_ART[name].variants || 1;
  return ({ seed = 0, place = false }) => {
    const variant = count > 1 && Number.isFinite(seed) ? Math.abs(Math.floor(seed)) % count : 0;
    const id = buildingArtId(name, variant);
    ensureDef(id, () => buildingArtDef(name, variant));
    return (
      <svg viewBox={place ? PLACE_VIEWBOX : buildingIconBox(name)} className="w-full h-full" style={{ overflow: 'visible' }}>
        <use href={`#${id}`} />
      </svg>
    );
  };
};

export const SvgShop = artOf('shop');
export const SvgWall = artOf('wall');
export const SvgFence = artOf('fence');
export const SvgMine = artOf('mine');
export const SvgTorii = artOf('torii');
export const SvgDragon = artOf('dragon');
export const SvgBellTower = artOf('bell_tower');
export const SvgClockTower = artOf('clock_tower');
export const SvgFestivalStage = artOf('festival_stage');
export const SvgHouse2 = artOf('house2');
export const SvgHouse3 = artOf('house3');
export const SvgFactory = artOf('factory');
export const SvgHospital = artOf('hospital');
export const SvgFireStation = artOf('fire_station');
export const SvgGoldenTower = artOf('golden_tower');
export const SvgCrystalTower = artOf('crystal_tower');
export const SvgStation = artOf('station');
export const SvgTemple = artOf('temple');
export const SvgCastle = artOf('castle');
export const SvgGoldCastle = artOf('gold_castle');
export const SvgNationalLibrary = artOf('national_library');
export const SvgSchool = artOf('school');
export const SvgLibrary = artOf('library');
export const SvgTownhall = artOf('townhall');
export const SvgEmbassy = artOf('embassy');
export const SvgGrandSmithy = artOf('grand_smithy');
export const SvgFamilyRestaurant = artOf('family_restaurant');
export const SvgCinema = artOf('cinema');
export const SvgWatermill = artOf('watermill');
export const SvgHotSpring = artOf('hot_spring');
export const SvgPhilosophersLab = artOf('philosophers_lab');
export const SvgGuardianShrine = artOf('guardian_shrine');
export const SvgPool = artOf('pool');
export const SvgHotel = artOf('hotel');
export const SvgOfficeBuilding = artOf('office_building');
export const SvgTowerApartment = artOf('tower_apartment');
export const SvgGrandWarehouse = artOf('grand_warehouse');
export const SvgMonument = artOf('monument');
export const SvgObservatory = artOf('observatory');
export const SvgPerfectMonument = artOf('perfect_monument');
export const SvgTvTower = artOf('tv_tower');
export const SvgFerrisWheel = artOf('ferris_wheel');
export const SvgPark = artOf('park');
export const SvgCafe = artOf('cafe');
export const SvgBakery = artOf('bakery');
export const SvgBurgerShop = artOf('burger_shop');
export const SvgConvenienceStore = artOf('convenience_store');
export const SvgFlowerShop = artOf('flower_shop');
export const SvgPostOffice = artOf('post_office');
export const SvgPoliceBox = artOf('police_box');
export const SvgWarehouse = artOf('warehouse');
export const SvgMarket = artOf('market');
export const SvgSmithy = artOf('smithy');
export const SvgShoppingStreet = artOf('shopping_street');
export const SvgPort = artOf('port');
export const SvgDepartment = artOf('department');
export const SvgUniversity = artOf('university');
export const SvgAirport = artOf('airport');
export const SvgStadium = artOf('stadium');
export const SvgAmusementPark = artOf('amusement_park');
export const SvgCherryPavilion = artOf('cherry_pavilion');
export const SvgMegaGrandMarket = artOf('mega_grand_market');
export const SvgMegaFortress = artOf('mega_fortress');
export const SvgMegaAcademy = artOf('mega_academy');
export const SvgMegaImperialPalace = artOf('mega_imperial_palace');
export const SvgMegaWonder = artOf('mega_wonder');
export const SvgMegaHarborTown = artOf('mega_harbor_town');
export const SvgMegaShrineComplex = artOf('mega_shrine_complex');
export const SvgDragonShrine = artOf('dragon_shrine');

// 小さなもの（かざり・道ばたのもの・のりもの・庭）。絵は props-art.js
export const SvgWell = artOf('well');
export const SvgStoneLantern = artOf('stone_lantern');
export const SvgFountain = artOf('fountain');
export const SvgStatue = artOf('statue');
export const SvgGoldStatue = artOf('gold_statue');
export const SvgWindmill = artOf('windmill');
export const SvgGarden = artOf('garden');
export const SvgZenGarden = artOf('zen_garden');
export const SvgPlayground = artOf('playground');
export const SvgBench = artOf('bench');
export const SvgMailbox = artOf('mailbox');
export const SvgPhoneBooth = artOf('phone_booth');
export const SvgStreetLight = artOf('street_light');
export const SvgBusStop = artOf('bus_stop');
export const SvgVendingMachine = artOf('vending_machine');
export const SvgTrashCan = artOf('trash_can');
export const SvgCar = artOf('car');
export const SvgBus = artOf('bus');
export const SvgFireTruck = artOf('fire_truck');
export const SvgBicycle = artOf('bicycle');
export const SvgShipVehicle = artOf('ship_vehicle');
export const SvgAirplane = artOf('airplane');
export const SvgBridge = artOf('bridge');
