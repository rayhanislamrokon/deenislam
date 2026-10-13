export const ADMIN_PERMISSION_GROUPS=[
 ["Dashboard & Users",[["dashboard.view","Overview"],["users.view","Users"],["premium.manage","Grant Premium"],["devices.view","Device IDs"]]],
 ["Team & Security",[["admins.manage","Add Team Member & Access Control"],["deletions.review","Deletion Requests"],["audit.view","Admin Activity Log"],["settings.manage","Change Password / App Settings"]]],
 ["Ads & Billing",[["ads.view","Ad History"],["rewards.view","Ad Rewards Analytics"],["revenue.view","Ad Revenue"],["billing.view","Billing History"],["premium_packages.manage","Premium Packages"]]],
 ["Books & Learning",[["books.manage","Books Manager & Book Library"],["lifestyle.manage","Lifestyle Categories"],["prophets.manage","Prophets Content"],["islamic_history.manage","Islamic History"],["sahaba.manage","Sahaba Content"]]],
 ["Quran & Hadith",[["quran.manage","Quran Content"],["tafsir.manage","Tafsir Content & Tafsir Books"],["hadith.manage","Hadith Content & Hadith Books"]]],
 ["Worship & Pages",[["duas.manage","Duas Content"],["daily_prayer.manage","Daily Prayer Control"],["amol.manage","Amol Content"],["about.manage","About Page"],["privacy.manage","Privacy Policy"],["notifications.manage","Push Notifications"]]],
 ["Actions",[["users.manage","Manage users"],["content.publish","Publish content"],["content.delete","Delete content"]]],
] as const;

export const ADMIN_ROLE_DEFAULTS:Record<string,string[]>={
 admin:["dashboard.view","users.view","devices.view","books.manage","quran.manage","tafsir.manage","hadith.manage","duas.manage","amol.manage","sahaba.manage","daily_prayer.manage","lifestyle.manage","prophets.manage","islamic_history.manage","content.publish"],
 moderator:["dashboard.view","quran.manage","tafsir.manage","hadith.manage","duas.manage","amol.manage","books.manage","lifestyle.manage","prophets.manage"],
};

export const NAV_PERMISSION:Record<string,string>={
 "Overview":"dashboard.view","Users":"users.view","Grant Premium":"premium.manage","Premium Packages":"premium_packages.manage","Add Team Member":"admins.manage","Access Control":"admins.manage","Deletion Requests":"deletions.review","Admin Activity Log":"audit.view","Device IDs":"devices.view","Ad History":"ads.view","Ad Rewards Analytics":"rewards.view","Ad Revenue":"revenue.view","Billing History":"billing.view","Books Manager":"books.manage","Book Library":"books.manage","Lifestyle Categories":"lifestyle.manage","Prophets Content":"prophets.manage","Islamic History":"islamic_history.manage","Sahaba Content":"sahaba.manage","Quran Content":"quran.manage","Tafsir Content":"tafsir.manage","Tafsir Books":"tafsir.manage","Hadith Content":"hadith.manage","Hadith Books":"hadith.manage","Duas Content":"duas.manage","Daily Prayer Control":"daily_prayer.manage","About Page":"about.manage","Privacy Policy":"privacy.manage","Push Notifications":"notifications.manage","Amol Content":"amol.manage","Change Password":"settings.manage",
};

export function tokenPermissions(token:string){try{const body=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");const payload=JSON.parse(atob(body));return Array.isArray(payload.permissions)?payload.permissions:[]}catch{return[]}}
export function hasPermission(values:string[],permission:string){return values.includes("*")||values.includes(permission)}
