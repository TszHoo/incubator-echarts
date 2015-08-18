/**
 * ECharts global model
 *
 * @module {echarts/model/Global}
 */

define(function (require) {

    var zrUtil = require('zrender/core/util');
    var Model = require('./Model');

    var SeriesModel = require('./Series');
    var ComponentModel = require('./Component');

    /**
     * @alias module:echarts/model/Global
     *
     * @param {Object} option
     * @param {module:echarts/model/Model} parentModel
     * @param {Object} theme
     */
    var GlobalModel = Model.extend({

        constructor: GlobalModel,

        init: function (option, parentModel, theme) {

            this.option = {};

            /**
             * @type {Object.<string, module:echarts/model/Model>}
             * @private
             */
            this._components = {};

            /**
             * @type {Array.<module:echarts/model/Model}
             * @private
             */
            this._series = [];

            /**
             * @type {Object.<string, module:echarts/model/Model>}
             * @private
             */
            this._seriesMap = {};

            /**
             * @type {module:echarts/model/Model}
             * @private
             */
            this._theme = new Model(theme || {});

            this.mergeOption(option);
        },

        mergeOption: function (newOption) {

            var option = this.option;

            zrUtil.each(newOption.series, function (series, idx) {
                var seriesName = series.name || (series.type + idx);
                var seriesMap = this._seriesMap;
                var seriesModel = seriesMap[seriesName];
                if (seriesModel) {
                    seriesModel.mergeOption(series);
                }
                else {
                    seriesModel = SeriesModel.create(series, this, idx);
                    seriesModel.name = seriesName;
                    seriesMap[seriesName] = seriesModel;
                    this._series.push(seriesModel);
                }
            }, this);

            // 同步 Option
            option.series = this._series.map(function (seriesModel) {
                return seriesModel.option;
            });

            var components = this._components;
            for (var name in newOption) {
                var componentOption = newOption[name];
                // 如果不存在对应的 model 则直接 merge
                if (! ComponentModel.has(name)) {
                    if (typeof componentOption === 'object') {
                        componentOption = zrUtil.merge(option[name] || {}, componentOption);
                    }
                    else {
                        option[name] = componentOption;
                    }
                }
                else {
                    // Normalize
                    if (! (componentOption instanceof Array)) {
                        componentOption = [componentOption];
                    }
                    if (! components[name]) {
                        components[name] = [];
                    }
                    for (var i = 0; i < componentOption.length; i++) {
                        var componentModel = components[name][i];
                        if (componentModel) {
                            componentModel.mergeOption(
                                componentOption[i], this
                            );
                        }
                        else {
                            componentModel = ComponentModel.create(
                                name, componentOption[i], this
                            );
                            components[name][i] = componentModel;
                        }
                        if (componentModel) {
                            // 同步 Option
                            if (componentOption instanceof Array) {
                                option[name] = option[name] || [];
                                option[name][i] = componentModel.option;
                            }
                            else {
                                option[name] = componentModel.option;
                            }
                        }
                    }
                }
            }
        },

        getTheme: function () {
            return this._theme;
        },

        getComponent: function (type, idx) {
            var list = this._components[type];
            if (list) {
                return list[idx || 0];
            }
        },

        eachComponent: function (type, cb, context) {
            zrUtil.each(this._components[type], cb, context);
        },

        getSeriesByName: function (name) {
            return this._seriesMap[name];
        },

        getSeriesByType: function (type) {
            return zrUtil.filter(this._series, function (series) {
                return series.type === type;
            });
        },

        /**
         * @param {number} seriesIndex
         * @return {module:echarts/model/Series}
         */
        getSeries: function (seriesIndex) {
            return this._series[seriesIndex];
        },

        /**
         * @return {Array.<module:echarts/model/Series>}
         */
        getSeriesAll: function () {
            return this._series;
        },

        eachSeries: function (cb, context) {
            zrUtil.each(this._series, cb, context);
        },

        filterSeries: function (cb, context) {
            this._series = zrUtil.filter(this._series, cb, context);
        }
    });

    return GlobalModel;
});