import DirectoryItem from "discourse/components/directory-item";

export default DirectoryItem.extend({
  customDirectoryFields: Ember.String.w("email phone_number website organization corporate_title")
});
