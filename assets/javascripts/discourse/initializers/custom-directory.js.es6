import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed from "discourse-common/utils/decorators";
import { iconNode } from "discourse-common/lib/icon-library";
import Group from "discourse/models/group";
import { observes } from "discourse-common/utils/decorators";
import { registerUnbound } from "discourse-common/lib/helpers";

function initWithApi(api) {
  if (!Discourse.SiteSettings.custom_directory_enabled) return;

  const defaultPeriod = "all";
  const defaultOrder = "name";
  const defaultAsc = true;

  registerUnbound('is-website', function(value) {
    return value == 'website';
  });

  api.modifyClass("controller:users", {
    period: defaultPeriod,
    order: defaultOrder,
    asc: defaultAsc,
    isShowMore: false,
    @discourseComputed('group')
    selectedGroupId(group) {
      let selectedGroup =  this.get('availableGroups').find(item=>item.name === group);
      return selectedGroup ? selectedGroup.id : -1;
    },

    actions: {
      toggleShowMore() {
        this.toggleProperty("isShowMore");

        if (!this.get("isShowMore")) {
          this.set("period", defaultPeriod);
        }
      },
      updateGroupParam(selectedGroups, currentSelection) {
          this.set('group', currentSelection ? currentSelection.name : null);
      },
    },

    @discourseComputed("isShowMore")
    showMoreBtnLabel(isShowMore) {
      return `custom_directory.show_${isShowMore ? "less" : "more"}`;
    },
  });

  api.modifyClass("route:users", {
    renderTemplate() {
      if (!this.site.mobileView) {
        this.render("custom-user-directory");
      } else {
        this.render("custom-user-directory-mobile");
      }
    },

    resetController(controller, isExiting) {
      if (isExiting) {
        controller.setProperties({
          period: defaultPeriod,
          order: defaultOrder,
          asc: defaultAsc,
          name: "",
          group: null,
          exclude_usernames: null,
        });
      }
    },

    setupController(controller, params) {
      this._super(...arguments);
      controller.set('availableGroups', this._availableGroups);
    },

    afterModel(model) {
      return Group.findAll().then(groups => {
        this.set('_availableGroups', groups);
        return model;
      });
    }
  });

  api.modifyClass("component:table-header-toggle", {
    @discourseComputed("field", "labelKey", "rawLabel")
    title(field, labelKey, rawLabel) {
      if (rawLabel) return rawLabel;

      return this._super(...arguments);
    },

    // null does not trigger refreshModel
    // PR to Discourse core?
    toggleProperties() {
      if (this.order === this.field) {
        this.set("asc", this.asc ? false : true);
      } else {
        this.setProperties({ order: this.field, asc: false });
      }
    },
  });

}

export default {
  name: "custom-directory",

  initialize() {
    withPluginApi("0.8", initWithApi);
  },
};
