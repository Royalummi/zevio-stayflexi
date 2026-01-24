"use client";

import styles from "./FloatingElements.module.css";
import {
  FiMapPin,
  FiKey,
  FiStar,
  FiCalendar,
  FiWifi,
  FiHeart,
  FiCamera,
  FiCompass,
  FiCoffee,
  FiSun,
  FiUmbrella,
  FiGift,
} from "react-icons/fi";
import { IoAirplaneOutline, IoDiamondOutline } from "react-icons/io5";
import {
  MdOutlineVilla,
  MdOutlineApartment,
  MdOutlinePool,
  MdOutlineDeck,
  MdOutlineKingBed,
  MdOutlineLuggage,
} from "react-icons/md";
import { TbBeach, TbMountain } from "react-icons/tb";

export default function FloatingElements() {
  return (
    <div className={styles.floatingContainer}>
      {/* Large Prominent Icons - Main Features */}
      <div
        className={`${styles.floatingElement} ${styles.large} ${styles.float1}`}
      >
        <MdOutlineVilla size={48} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.large} ${styles.float2}`}
      >
        <FiKey size={44} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.large} ${styles.float3}`}
      >
        <MdOutlineApartment size={46} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.large} ${styles.float4}`}
      >
        <TbBeach size={44} />
      </div>

      {/* Medium Icons - Amenities & Services */}
      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float5}`}
      >
        <MdOutlinePool size={36} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float6}`}
      >
        <MdOutlineKingBed size={38} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float7}`}
      >
        <FiCalendar size={34} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float8}`}
      >
        <FiWifi size={34} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float9}`}
      >
        <MdOutlineDeck size={36} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.medium} ${styles.float10}`}
      >
        <FiCoffee size={34} />
      </div>

      {/* Small Icons - Travel & Experience */}
      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float11}`}
      >
        <IoAirplaneOutline size={28} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float12}`}
      >
        <FiMapPin size={26} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float13}`}
      >
        <FiCompass size={28} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float14}`}
      >
        <MdOutlineLuggage size={28} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float15}`}
      >
        <FiCamera size={26} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.small} ${styles.float16}`}
      >
        <TbMountain size={28} />
      </div>

      {/* Micro Icons - Accents */}
      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float17}`}
      >
        <FiStar size={20} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float18}`}
      >
        <FiHeart size={20} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float19}`}
      >
        <IoDiamondOutline size={20} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float20}`}
      >
        <FiSun size={20} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float21}`}
      >
        <FiUmbrella size={20} />
      </div>

      <div
        className={`${styles.floatingElement} ${styles.micro} ${styles.float22}`}
      >
        <FiGift size={20} />
      </div>

      {/* Premium Gradient Orbs - Depth & Atmosphere */}
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      {/* Sparkles - Luxury Touch */}
      <div className={`${styles.sparkle} ${styles.sparkle1}`}>✦</div>
      <div className={`${styles.sparkle} ${styles.sparkle2}`}>✦</div>
      <div className={`${styles.sparkle} ${styles.sparkle3}`}>✦</div>
      <div className={`${styles.sparkle} ${styles.sparkle4}`}>✦</div>
      <div className={`${styles.sparkle} ${styles.sparkle5}`}>✦</div>
      <div className={`${styles.sparkle} ${styles.sparkle6}`}>✦</div>
    </div>
  );
}
