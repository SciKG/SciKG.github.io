(function() {

  var box, color, currentDataset, force, getSvgBox, graph, lastChoice, last_detail_node, link, links, loaded, node, nodes, setMetaAnchor, showDetail, showLink, svg, update, years;

  color = d3.scale.category10();

  getSvgBox = function() {
    var el;
    el = document.querySelector('#svg-wrap');
    return el.getBoundingClientRect();
  };

  svg = d3.select("#main-view");
  box = getSvgBox();
  force = d3.layout.force().charge(-150).linkDistance(100).size([box.width, box.height]).alpha(1);

  links = force.links();
  nodes = force.nodes();
  link = svg.selectAll(".link");
  node = svg.selectAll(".node");

  graph = null;
  currentDataset = null;
  years = null;
  last_detail_node = 3;

  showLink = function(data) {
    var html;
    html = '';
    if (data) {
      html += '<table>';
      html += '<tr>';
      html += "<th>From</th>";
      html += "<td>" + data.source.name + "</td>";
      html += '</tr>';
      html += '<tr>';
      html += "<th>To</th>";
      html += "<td>" + data.target.name + "</td>";
      html += '</tr>';
      html += '<tr>';
      html += "<th>Type</th>";
      html += "<td>" + (data.name || 'null') + "</td>";
      html += '</tr>';
      html += '</table>';
    }
    return (document.getElementById('explaination-link')).innerHTML = html;
  };

  showDetail = function(data) {
    var html;
    last_detail_node = data.id;
    category_map = {
      1: 'Statement Node',
      2: 'Predicate Node',
      3: 'Concept Node',
      4: 'Attribute Node'
    };
    html = '<table>';
    html += '<tr>';
    html += "<th>Category</th>";
    html += "<td>" + category_map[data.category] + "</td>";
    html += '</tr>';
    html += '<tr>';
    html += "<th>Name</th>";
    html += "<td>" + data.name + "</td>";
    html += '</tr>';
    html += '<tr>';
    html += "<th valign=top>Sent</th>";
    html += "<td><i>" + (data.sent || '(move to stmt node to see)') + "</i></td>";
    html += '</tr>';
    html += '<tr>';
    html += "<th valign=top>Tuples</th>";
    html += "<td>" + (data.tuples || '(move to non-stmt node to see)') + "</td>";
    html += '</tr>';
    html += '</table>';
    return (document.getElementById('explaination-node')).innerHTML = html;
  };

  setMetaAnchor = function() {
    var i, offset, y, _i, _results;
    box = getSvgBox();
    y = box.height * 0.5;
    offset = box.width / 10;
    nodes = currentDataset.nodes;
    nodes[2].x = nodes[2].px = offset;
    nodes[1].x = nodes[1].px = box.width / 2;
    nodes[0].x = nodes[0].px = box.width - offset;
    _results = [];
    for (i = _i = 0; _i < 3; i = ++_i) {
      nodes[i].y = nodes[i].py = y;
      _results.push(nodes[i].fixed = true);
    }
    return _results;
  };

  loaded = [];

  lastChoice = 0;

  update = function(_index) {
    last_detail_node = 3;
    var cur, nodeG, priority, year;
    document.querySelector('svg').innerHTML = '';
    (document.getElementById('year-title')).innerText = years[_index];
    year = years[_index];
    lastChoice = _index;
    cur = currentDataset = graph[year];
    setMetaAnchor();
    force.nodes(cur.nodes).links(cur.links).linkStrength(function(d) {
      if (d.rate) {
        return d.rate / 200;
      }
      return .1;
    }).linkDistance(function(d) {
      if (d.type === "inner") {
        return 0.1;
      } else if (d.type === "outer") {
        return 200;
      } else {
        return 1;
      }
    });
    force.start();
    showDetail(cur.nodes[last_detail_node]);
    showLink();
    link = svg.selectAll(".link").data(cur.links);
    link.enter().append("line").attr("class", function(d) {
      switch (d.type) {
        case "inner":
        case "outer":
          return "link";
        case "metalink":
          return "metalink link";
        default:
          throw 'not support type';
      }
    });
    link.exit().remove();
    link.transition().duration(850).style("stroke-width", function(d) {
      if (d.rate) {
        return Math.sqrt(d.rate) / 10;
      }
      return 0.4;
    }).attr("class", function(d) {
      switch (d.type) {
        case "inner":
        case "outer":
          return "link";
        case "metalink":
          return "metalink link";
        default:
          throw 'not support type';
      }
    });
    link.on('mouseenter', function(d) {
      var _ref2;
      if ((_ref2 = d.type) === 'inner' || _ref2 === 'outer') {
        return showLink(d);
      }
    });

    priority = {
      inner: 0,
      outer: 1,
      normal: 10,
      metalink: 0
    };
    svg.selectAll(".node, .link").sort(function(a, b) {
      if (priority[a.type] > priority[b.type]) {
        return 1;
      }
      return -1;
    });
    node = svg.selectAll(".node").data(cur.nodes, function(d) {
      return d.id;
    });
    nodeG = node.enter().append("g").attr("class", function(d) {
      switch (d.type) {
        case "normal":
          return "node";
        case "meta":
          return "meta node";
        default:
          throw 'not support type';
      }
    }).call(force.drag);
    nodeG.append("circle").attr("r", 10).style("opacity", 1);
    nodeG.append("text").attr("dy", ".35em").style("text-anchor", "middle").text(function(d) {
      return d.name;
    });
    nodeG.append("title").text(function(d) {
      return d.name;
    });
    node.exit().remove();
    node.transition().duration(350).select("circle").attr("r", function(d,i) {
      if (d.type === "meta") {
        return 1;
      }
      if (d.rate) {
        if (d.category == 1){
          return 8 + d.rate * 3;
        }
        return 8 + d.rate * 5;
      } else {
        return 8;
      }
    }).style("opacity", function(d) {
      if (d.type === "meta") {
        return 0.2;
      } else {
        if (d.rate) {
          return 1;
        } else {
          return 0.5;
        }
      }
    }).attr("fill", function(d) {
      return color(d.category);
    });
    node.on('mouseenter', function(d) {
      return showDetail(d);
    });
  };


  d3.json("graph.json", function(error, graphJSON) {
    var keymap, scollbar, offset;
    years = graphJSON.year_description;
    graph = graphJSON.data;

    offset = {
      3: -1,
      4: -1,
      2: 0,
      1: 1
    };
    force.on("tick", function(e) {
      var k;
      k = 3 * e.alpha;
      currentDataset.nodes.forEach(function(o) {
        o.x += offset[o.category] * k;
      });
      link.attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });
      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });
    
    update(0);
    scollbar = document.getElementById('year-select');
    scollbar.onchange = function(e) {
      update(parseInt(this.value));
      return false;
    };

    keymap = {
      37: -1,
      39: +1
    };
    window.onkeydown = function(e) {
      var newValue, value;
      if (value = keymap[e.keyCode]) {
        newValue = parseInt(scollbar.value) + value;
        if ((0 <= newValue && newValue < years.length)) {
          scollbar.value = newValue;
          return update(newValue);
        }
      }
    };
    window.onresize = function(e) {
      box = getSvgBox();
      force.size([box.width, box.height]);
      return update(lastChoice);
    };
  });

}).call(this);
