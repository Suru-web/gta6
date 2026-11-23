/** Explicit material bindings for rigs whose mesh names differ from their GLB source. */
export const CHARACTER_MATERIAL_BINDINGS: Record<string, Record<string, string>> = {
  'carl-johnson': {
    Object_7: 'Mat_1',  // torso and arms
    Object_9: 'Mat_2',  // face detail
    Object_11: 'Mat_2', // head
    Object_13: 'Mat_0', // jeans
    Object_15: 'material', // shoes
  },
};
