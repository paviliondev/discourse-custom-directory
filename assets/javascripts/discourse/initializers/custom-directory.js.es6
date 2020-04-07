import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed from "discourse-common/utils/decorators";
import { iconNode } from "discourse-common/lib/icon-library";

function initWithApi(api) {
  if (!Discourse.SiteSettings.custom_directory_enabled) return;

  const defaultPeriod = "all";
  const defaultOrder = "name";
  const defaultAsc = true;

  api.modifyClass("controller:users", {
    period: defaultPeriod,
    order: defaultOrder,
    asc: defaultAsc,
    isShowMore: false,

    actions: {
      toggleShowMore() {
        this.toggleProperty("isShowMore");

        if (!this.get("isShowMore")) {
          this.set("period", defaultPeriod);
        }
      }
    },

    @discourseComputed("isShowMore")
    showMoreBtnLabel(isShowMore) {
      return `custom_directory.show_${isShowMore ? "less" : "more"}`;
    }
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
          exclude_usernames: null
        });
      }
    }
  });

  api.modifyClass("component:directory-toggle", {
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
    }
  });

  api.decorateWidget("header-icons:before", dec => {
    const title = I18n.t("custom_directory.title");
    const icon = dec.h(
      "a.icon.btn-flat",
      {
        attributes: {
          href: "/u",
          title,
          "aria-label": title,
          id: "user-directory-icon"
        }
      },
      iconNode("users")
    );

    return dec.h("li", icon);
  });
}

export default {
  name: "custom-directory",

  initialize() {
    withPluginApi("0.8", initWithApi);
  }
};
