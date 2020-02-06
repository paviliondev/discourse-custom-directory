# frozen_string_literal: true

class User
  CUSTOM_DIRECTORY_FIELDS = ['Phone Number', 'Organization', 'Corporate Title'].freeze

  def custom_directory_fields
    @custom_directory_fields ||= begin
      result = {}

      UserField
        .where(name: CUSTOM_DIRECTORY_FIELDS)
        .each do |uf|
          result[uf.name] = uf.id.to_s
        end

      result
    end
  end

  CUSTOM_DIRECTORY_FIELDS.each do |f|
    define_method(f.gsub(' ', '').underscore.to_sym) do
      uf_id = custom_directory_fields[f]

      return unless uf_id.present?

      user_fields[uf_id]
    end
  end
end
