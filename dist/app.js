let mouseInteraction = false;

processedData("production").then((result) => {
  console.log(result);
  const title = result[0];
  Highcharts.chart("pieChartContainer", {
    chart: {
      type: "pie",
      events: {
        load: () => {
          mouseInteraction = true;
        },
      },
    },
    title: {
      text: title,
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f} %",
        },

        point: {
          events: {
            mouseOver: function () {
              if (mouseInteraction == false) {
                return;
              }
              const currentPoint = this;
              const chart = currentPoint.series.chart;

              // Calculate the percentage of the current hovered part
              const percentage = currentPoint.percentage;

              // Calculate the dynamic innerSize based on the percentage
              const dynamicInnerSize = `${percentage / 2 + 40}%`;

              // Update the series with the dynamic innerSize
              currentPoint.series.update(
                {
                  innerSize: dynamicInnerSize,
                },
                false,
              );

              currentPoint.update({
                sliced: true,
              });

              // Redraw the chart to apply the changes
              chart.redraw();
            },
            mouseOut: function () {
              if (mouseInteraction == false) {
                return;
              }
              // Reset innerSize on mouse out
              this.series.update(
                {
                  innerSize: "40%", // Adjust this value based on your preference
                },
                false,
              );

              this.update({
                sliced: false,
              });

              // Redraw the chart to apply the changes
              this.series.chart.redraw();
            },
          },
        },
      },
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y:.3f}</b>",
    },
    series: [
      {
        name: "Language",
        data: result[1], // Assuming you have your data here
      },
    ],
  });
});

(function (H) {
  H.seriesTypes.pie.prototype.animate = function (init) {
    const series = this,
      chart = series.chart,
      points = series.points,
      { animation } = series.options,
      { startAngleRad } = series;

    function fanAnimate(point, startAngleRad) {
      const graphic = point.graphic,
        args = point.shapeArgs;

      if (graphic && args) {
        graphic
          .attr({
            start: startAngleRad,
            end: startAngleRad,
            opacity: 1,
          })
          // Animate to the final position
          .animate(
            {
              start: args.start,
              end: args.end,
            },
            {
              duration: animation.duration / points.length,
            },
            function () {
              // On complete, start animating the next point
              if (points[point.index + 1]) {
                fanAnimate(points[point.index + 1], args.end);
              }
              // On the last point, fade in the data labels, then
              // apply the inner size
              if (point.index === series.points.length - 1) {
                series.dataLabelsGroup.animate(
                  {
                    opacity: 1,
                  },
                  void 0,
                  function () {
                    points.forEach((point) => {
                      point.opacity = 1;
                    });
                    series.update(
                      {
                        enableMouseTracking: true,
                      },
                      false,
                    );
                    chart.update({
                      plotOptions: {
                        pie: {
                          innerSize: "40%",
                          borderRadius: 4,
                        },
                      },
                    });
                  },
                );
              }
            },
          );
      }
    }

    if (init) {
      // Hide points on init
      points.forEach((point) => {
        point.opacity = 0;
      });
    } else {
      fanAnimate(points[0], startAngleRad);
    }
  };
})(Highcharts);
