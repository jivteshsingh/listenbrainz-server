import * as React from "react";
import Slider from "rc-slider";
import { countBy, debounce, zipObject } from "lodash";
import Tooltip from "rc-tooltip";
import { formatReleaseDate, useMediaQuery } from "./utils";

type ReleaseTimelineProps = {
  releases: Array<FreshReleaseItem>;
};

export default function ReleaseTimeline(props: ReleaseTimelineProps) {
  const { releases } = props;

  const [currentValue, setCurrentValue] = React.useState<number | number[]>();
  const [marks, setMarks] = React.useState<{ [key: number]: string }>({});
  const [longMonthMarks, setLongMonthMarks] = React.useState<{
    [key: number]: string;
  }>({});

  const screenMd = useMediaQuery("(max-width: 992px)"); // @screen-md

  const changeHandler = React.useCallback((percent: number | number[]) => {
    setCurrentValue(percent);
    const element: HTMLElement | null = document.getElementById(
      "release-cards-grid"
    )!;
    const scrollHeight = ((percent as number) / 100) * element.scrollHeight;
    const scrollTo = scrollHeight + element.offsetTop;
    window.scrollTo({ top: scrollTo, behavior: "smooth" });
    return scrollTo;
  }, []);

  function createMarks(data: Array<FreshReleaseItem>) {
    const releasesPerDate = countBy(
      releases,
      (item: FreshReleaseItem) => item.release_date
    );
    const datesArr = Object.keys(releasesPerDate).map((item) =>
      formatReleaseDate(item)
    );
    const percentArr = Object.values(releasesPerDate)
      .map((item) => (item / data.length) * 100)
      .map((_, index, arr) =>
        arr.slice(0, index + 1).reduce((prev, curr) => prev + curr)
      );

    /**
     * We want the timeline dates or marks to start where the grid starts.
     * So the 0% should always have the first date. Therefore we use unshift(0) here.
     * With the same logic, we don't want the last date to be at 100% because
     * that will mean we're at the bottom of the grid.
     * The last date should start before 100%. That explains the pop().
     */
    percentArr.unshift(0);
    percentArr.pop();
    const middle = percentArr[Math.floor(percentArr.length / 2)];

    // Scroll to the current date
    setCurrentValue(middle);
    window.scrollTo({ top: changeHandler(middle), behavior: "smooth" });

    return zipObject(percentArr, datesArr);
  }

  const handleScroll = React.useCallback(
    debounce(() => {
      // TODO change to relative position of #release-cards-grid instead of window
      const scrollPos =
        (window.scrollY / document.documentElement.scrollHeight) * 100;
      setCurrentValue(scrollPos);
    }, 300),
    []
  );

  React.useEffect(() => {
    setLongMonthMarks(createMarks(releases));
  }, [releases]);

  React.useEffect(() => {
    const newARR = Object.values(longMonthMarks).map((mark) => {
      return mark.slice(0, 6);
    });
    setMarks(zipObject(Object.keys(longMonthMarks), newARR));
  }, [longMonthMarks]);

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="slider-container">
      <Slider
        className={screenMd ? "slider-horizontal" : "slider-vertical"}
        vertical={!screenMd}
        reverse={!screenMd}
        included={false}
        marks={marks}
        value={currentValue}
        onChange={changeHandler}
        /* eslint-disable */
        handleRender={(node, handleProps) => {
          const { value } = handleProps;

          // Formatting date from value of the slider 
          
          let values;

          const tooltipArr = Object.entries(longMonthMarks).slice(0).reverse();
          for (let i = 0; i < tooltipArr.length; i++) {
            if (value >= +tooltipArr[i][0]) {
                values = tooltipArr[i][1];
              
              break;
            }
          }

          return (
            <Tooltip
              overlayInnerStyle={{ minHeight: "auto" }}
              overlay={
              <div><h1>{values?.slice(0,2)}</h1>
              <h3>{values?.slice(2)}</h3>
            </div>}
              placement={screenMd ? "top" : "left"}
            >
              {node}
            </Tooltip>
          );
        }}
        /* eslint-enable */
      />
    </div>
  );
}
