import React from 'react';
import { ensureDef } from './shared.jsx';
import { BUILDING_ART, buildingArtDef, buildingArtId } from './buildings-art.js';

// 建物（新しい絵がら）
//
// 絵のおおもとは buildings-art.js にあり、その建物を はじめて描くときに 文書へ 1 回だけ置く
// （shared.jsx の ensureDef）。ここの部品は、それを <use> で呼びだすだけ（1 つ 2 要素）。

/**
 * 絵の名前から、町のアイテムの部品を作る。
 * 色ちがい（variants）のある絵は、置いた場所（seed）で どれにするかが決まる。
 */
const artOf = (name) => {
  const count = BUILDING_ART[name].variants || 1;
  return ({ seed = 0 }) => {
    const variant = count > 1 && Number.isFinite(seed) ? Math.abs(Math.floor(seed)) % count : 0;
    const id = buildingArtId(name, variant);
    ensureDef(id, () => buildingArtDef(name, variant));
    return (
      <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: 'visible' }}>
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
