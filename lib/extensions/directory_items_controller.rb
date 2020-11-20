# frozen_string_literal: true

# I have to do this because the sorting happens at the middle of the code
class DirectoryItemsController
  alias_method :orig_index, :index

  def custom_index
    raise Discourse::InvalidAccess.new(:enable_user_directory) unless SiteSetting.enable_user_directory?

    period = params.require(:period)
    period_type = DirectoryItem.period_types[period.to_sym]
    raise Discourse::InvalidAccess.new(:period_type) unless period_type
    result = DirectoryItem.where(period_type: period_type).includes(:user)

    if params[:group]
      result = result.includes(user: :groups).where(users: { groups: { name: params[:group] } })
    else
      result = result.includes(user: :primary_group)
    end
    result = result.includes(user: :user_profile)

    if params[:exclude_usernames]
      result = result.references(:user).where.not(users: { username: params[:exclude_usernames].split(",") })
    end

    order = params[:order] || 'name' # DirectoryItem.headings.first
    dir = params[:asc] ? 'ASC' : 'DESC'

    if DirectoryItem.headings.include?(order.to_sym)
      result = result.order("directory_items.#{order} #{dir}")
    end

    if order == 'name'
      result = result.references(:user).order("users.name #{dir}")
    end

    if period_type == DirectoryItem.period_types[:all]
      result = result.includes(:user_stat)
    end
    page = params[:page].to_i

    user_ids = nil
    if params[:name].present?
      user_ids = UserSearch.new(params[:name], include_staged_users: true).search.pluck(:id)
      if user_ids.present?
        # Add the current user if we have at least one other match
        if current_user && result.dup.where(user_id: user_ids).exists?
          user_ids << current_user.id
        end
        result = result.where(user_id: user_ids)
      else
        result = result.where('false')
      end
    end

    if params[:username]
      user_id = User.where(username_lower: params[:username].to_s.downcase).pluck_first(:id)
      if user_id
        result = result.where(user_id: user_id)
      else
        result = result.where('false')
      end
    end

    result_count = result.count
    result = result.limit(PAGE_SIZE).offset(PAGE_SIZE * page).to_a

    more_params = params.slice(:period, :order, :asc, :group).permit!
    more_params[:page] = page + 1

    # Put yourself at the top of the first page
    if result.present? && current_user.present? && page == 0

      position = result.index { |r| r.user_id == current_user.id }

      # Don't show the record unless you're not in the top positions already
      if (position || 10) >= 10
        your_item = DirectoryItem.where(period_type: period_type, user_id: current_user.id).first
        result.insert(0, your_item) if your_item
      end

    end

    render_json_dump(directory_items: serialize_data(result, DirectoryItemSerializer),
                     total_rows_directory_items: result_count,
                     load_more_directory_items: directory_items_path(more_params))
  end

  def index
    if SiteSetting.custom_directory_enabled
      custom_index
    else
      orig_index
    end
  end
end
