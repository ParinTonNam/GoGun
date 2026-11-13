import type { Locale } from "@/lib/locale";
import type { TripTemplate } from "@/lib/trip-templates";

type EnglishDay = { label: string; activities: Array<[title: string, description: string]> };
type EnglishTemplate = { name: string; destination: string; days: EnglishDay[] };

// Editorial examples only. Trips and activities created by users are never passed through here.
const ENGLISH_TEMPLATES: Record<string, EnglishTemplate> = {
  "tokyo-kyoto": {
    name: "Autumn colors in Japan", destination: "Japan", days: [
      { label: "Travel · Osaka", activities: [
        ["Fly to Japan", "Board your flight and get ready to explore Osaka"],
        ["Arrive at Kansai Airport", "Clear immigration, collect your bags, and head into Osaka"],
        ["Check in at the hotel", "Drop off your bags and rest before going out"],
        ["Dinner in Dotonbori", "Try takoyaki and okonomiyaki"],
        ["Explore Namba", "Shop and take photos by the Glico sign"],
        ["Return to the hotel", "Rest up for the next day"],
      ] },
      { label: "Kyoto · Autumn leaves", activities: [
        ["Travel to Kyoto", "Take the train from Osaka to Arashiyama"],
        ["Togetsukyo Bridge and Bamboo Grove", "See the autumn colors by the river and walk through the bamboo grove"],
        ["Lunch in Gion", "Enjoy a traditional Japanese set meal"],
        ["Kiyomizu-dera Temple", "See one of Kyoto's favorite autumn viewpoints"],
        ["Return to Osaka · Dinner in Umeda", "Stop for yakiniku before heading back to the hotel"],
      ] },
      { label: "Shopping · Journey home", activities: [
        ["Kuromon Market", "Find sushi, fresh fruit, and other breakfast treats"],
        ["Rinku Premium Outlets", "Shop for souvenirs near Kansai Airport"],
        ["Check in at Kansai Airport", "Drop off your bags and get ready to fly home"],
      ] },
    ],
  },
  "korea-sakura": {
    name: "Cherry blossoms in Korea", destination: "South Korea", days: [
      { label: "Seoul · Yeouido · Hongdae", activities: [
        ["Arrive at Incheon Airport", "Take the express train into Seoul and drop off your bags"],
        ["Cherry blossoms at Yeouido Park", "Photograph the blossom tunnel along the Han River"],
        ["Cafe in Yeonnam-dong", "Stop for coffee and Korean-style cake"],
        ["Walk and dine in Hongdae", "Shop for clothes and watch evening street performances"],
      ] },
      { label: "Gyeongbokgung Palace · Myeongdong", activities: [
        ["Wear hanbok at Gyeongbokgung Palace", "Take photos among the palace cherry trees"],
        ["Bukchon Hanok Village", "Explore traditional houses and Seoul viewpoints"],
        ["Skincare shopping in Myeongdong", "Try street food and buy souvenirs before leaving"],
      ] },
    ],
  },
  "phuket-sea": {
    name: "Phuket beach trip", destination: "Thailand", days: [
      { label: "Phuket Old Town · Promthep Cape", activities: [
        ["Arrive in Phuket and collect a rental car", "Drive into Phuket Town"],
        ["Dim sum brunch and the Old Town", "Photograph the Sino-Portuguese buildings on Thalang Road"],
        ["Check in near Kata Beach", "Rest and take a walk along the beach"],
        ["Sunset at Promthep Cape", "Watch the evening light over the Andaman Sea"],
        ["Seafood dinner", "Try lobster and flavorful southern Thai dishes"],
      ] },
      { label: "Coral Island · Journey home", activities: [
        ["Speedboat to Coral Island", "Snorkel and relax by the clear water"],
        ["Return ashore and shop for souvenirs", "Pick up local chili paste and Phuket pastries"],
        ["Arrive at Phuket Airport", "Return the rental car and get ready to fly home"],
      ] },
    ],
  },
  "switzerland-hike": {
    name: "Hiking in Switzerland", destination: "Switzerland", days: [
      { label: "Interlaken · Lauterbrunnen", activities: [
        ["Scenic train to Interlaken", "Enjoy turquoise lake views along the route"],
        ["Lauterbrunnen Village", "Explore the valley of 72 waterfalls and Swiss wooden houses"],
        ["Cable car to Grindelwald First", "Hike toward Bachalpsee and photograph the Alps"],
        ["Swiss cheese fondue dinner", "Relax in a chalet in the valley"],
      ] },
      { label: "Zermatt · Matterhorn", activities: [
        ["Train to the Gornergrat viewpoint", "Enjoy a panoramic view of the Matterhorn"],
        ["Walk to Lake Riffelsee", "Photograph the Matterhorn reflected in the water"],
        ["Explore car-free Zermatt", "Buy Swiss chocolate and souvenirs"],
      ] },
    ],
  },
  "taiwan-foodie": {
    name: "Taiwan food trip", destination: "Taiwan", days: [
      { label: "Taipei · Ximending · Night market", activities: [
        ["Arrive at Taoyuan Airport and head to Taipei", "Take the express train to Taipei Main Station"],
        ["Ay-Chung noodles and bubble tea", "Drop off your bags and start tasting food in Ximending"],
        ["Chiang Kai-shek Memorial Hall", "Watch the changing of the guard and visit a tea cafe"],
        ["Raohe Night Market", "Try pepper buns, grilled squid, and stinky tofu"],
      ] },
      { label: "Jiufen · Shifen", activities: [
        ["Release a lantern in Shifen", "Write a wish and release a lantern beside the old railway"],
        ["Explore Jiufen Old Street", "Try taro balls and sip tea with sea and mountain views"],
        ["Taiwanese mala hotpot", "Finish the trip with premium beef and ice cream"],
      ] },
    ],
  },
  "singapore-city": {
    name: "A day in Singapore", destination: "Singapore", days: [
      { label: "Marina Bay · Gardens by the Bay", activities: [
        ["Arrive at Changi Airport and visit Jewel", "Photograph the indoor Rain Vortex waterfall"],
        ["Tian Tian chicken rice at Maxwell Food Centre", "Enjoy a popular Chinatown lunch"],
        ["Merlion Park and Marina Bay", "Visit the waterfront landmarks"],
        ["Gardens by the Bay", "Explore Cloud Forest and Supertree Grove"],
        ["Garden Rhapsody light show", "Watch the evening lights beneath the Supertrees"],
      ] },
    ],
  },
  bangsaen: {
    name: "A day in Bangsaen", destination: "Bangsaen, Chonburi", days: [
      { label: "Explore Bangsaen", activities: [
        ["Leave Bangkok", "Meet up and begin the journey"],
        ["Arrive in Bangsaen · Beachside cafe", "Stop for coffee by the sea"],
        ["Seafood lunch at Nong Mon Market", "Enjoy fresh seafood and shop for local gifts"],
        ["Sunset by the beach", "Walk along Bangsaen Beach in the evening"],
      ] },
    ],
  },
  ayutthaya: {
    name: "Temples of old Ayutthaya", destination: "Ayutthaya", days: [
      { label: "Explore the old city", activities: [
        ["Leave Bangkok", "Travel to Phra Nakhon Si Ayutthaya"],
        ["Wat Mahathat", "See the Buddha head in the tree roots"],
        ["Boat noodles and roti sai mai", "Take a lunch break by the river"],
        ["Wat Chaiwatthanaram", "Photograph the historic site before heading home"],
      ] },
    ],
  },
};

export function localizeTemplate(template: TripTemplate, locale: Locale): TripTemplate {
  if (locale === "th") return template;
  const translated = ENGLISH_TEMPLATES[template.id];
  if (!translated) return template;
  return {
    ...template,
    name: translated.name,
    destination: translated.destination,
    meta: `${translated.destination} · 5 people`,
    days: template.days.map((day, dayIndex) => ({
      ...day,
      label: translated.days[dayIndex]?.label ?? day.label,
      activities: day.activities.map((activity, activityIndex) => {
        const copy = translated.days[dayIndex]?.activities[activityIndex];
        return copy ? { ...activity, title: copy[0], description: copy[1] } : activity;
      }),
    })),
  };
}
