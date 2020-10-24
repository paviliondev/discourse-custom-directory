import DirectoryItem from "discourse/components/directory-item";

export default DirectoryItem.extend({
  customDirectoryFields: Ember.String.w(
    "email website phone_number"
  ),
});
