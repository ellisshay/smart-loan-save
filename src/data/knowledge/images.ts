import familyImg from "@/assets/knowledge/family-home.jpg";
import apartmentsImg from "@/assets/knowledge/apartments.jpg";
import houseImg from "@/assets/knowledge/dream-house.jpg";

export const knowledgeImages: Record<string, { src: string; width: number; height: number }> = {
  family: { src: familyImg, width: 1600, height: 900 },
  apartments: { src: apartmentsImg, width: 1600, height: 900 },
  house: { src: houseImg, width: 1600, height: 900 },
};
