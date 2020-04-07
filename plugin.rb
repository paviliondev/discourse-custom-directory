# name: custom-directory
# version: 0.1.1
# author: Muhlis Cahyono (muhlisbc@gmail.com)
# url: https://github.com/paviliondev/discourse-custom-directory

enabled_site_setting :custom_directory_enabled

%i[common desktop mobile].each do |type|
  register_asset "stylesheets/custom-directory/#{type}.scss", type
end

after_initialize do
  %w[
    extensions/directory_items_controller
    extensions/user
  ].each do |i|
    load File.expand_path("lib/#{i}.rb", __dir__)
  end

  %i[
    email
    phone_number
    organization
    corporate_title
  ].each do |k|
    add_to_serializer(:directory_item, k) do
      object.user.send(k)
    end
  end
end
