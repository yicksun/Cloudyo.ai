"use client";
// Public Cloudyo components recovered from the owner-designated reference site.
import * as S from "react";
import * as xt from "react";
import * as f from "react/jsx-runtime";
import { motion as je, AnimatePresence as Xv } from "framer-motion";
import { Link as ve, useLocation as I2, Button as qe, useReferenceRoute as $x, cx as ft, Tabs as Z4, TabsList as $w, TabsTrigger as sr, TabsContent as rr } from "../components/reference-adapters";
import { BusinessForm, NewsletterForm } from "../components/forms";
import { EditableCopy, useArticle, useResources, ArticleBody } from "../components/copy-provider";
import { Cloud as i0, ChevronDown as uA, X as s0, Menu as PA, Twitter as QA, Linkedin as DA, Github as bA, CircleCheck as Fn, ArrowRight as wn, Shield as Df, ChartColumn as Mf, Zap as zl, Database as Of, Building2 as oA, HeartPulse as CA, Factory as vA, ShoppingCart as GA, GraduationCap as AA, Landmark as RA, ArrowLeft as aA, User as $A, Clock as mA, Users as ZA, Trophy as KA, Globe as SA, Target as a0, CircleAlert as Rf, MapPin as VA, Phone as BA, Mail as _A, Handshake as jA } from "lucide-react";
const ox = [{
  name: "Our Expertise",
  path: "/expertise",
  dropdown: [{
    name: "Software Procurement",
    path: "/expertise/software-procurement",
    desc: "Optimize your software licensing"
  }, {
    name: "IT Cost Management",
    path: "/expertise/it-cost-management",
    desc: "Control your IT spend"
  }, {
    name: "Cloud Services",
    path: "/expertise/cloud-services",
    desc: "Migrate and manage cloud infrastructure"
  }, {
    name: "Data & AI Solutions",
    path: "/expertise/data-ai-solutions",
    desc: "Unlock value from your data"
  }]
}, {
  name: "Industries",
  path: "/industries"
}, {
  name: "Cloud Providers",
  path: "/cloud-providers"
}, {
  name: "About Us",
  path: "/about"
}, {
  name: "Contact Us",
  path: "/contact"
}, {
  name: "Partner With Us",
  path: "/partner-with-us"
}];
function QM() {
  const [t] = I2(),
    [i, s] = S.useState(!1),
    [r, l] = S.useState(!1),
    [d, u] = S.useState(null);
  return S.useEffect(() => {
    const m = () => {
      s(window.scrollY > 20);
    };
    return window.addEventListener("scroll", m), () => window.removeEventListener("scroll", m);
  }, []), S.useEffect(() => {
    l(!1), u(null);
  }, [t]), f.jsxs("header", {
    className: `fixed top-0 w-full z-50 transition-all duration-300 ${i ? "bg-white/95 backdrop-blur-sm shadow-sm py-3" : "bg-transparent py-5"}`,
    children: [f.jsx("div", {
      className: "container mx-auto px-4 md:px-6 lg:px-8",
      children: f.jsxs("div", {
        className: "flex items-center justify-between",
        children: [f.jsxs(ve, {
          href: "/",
          className: "flex items-center gap-2 z-50",
          children: [f.jsx("div", {
            className: `w-8 h-8 rounded-md flex items-center justify-center ${i || r ? "bg-primary text-white" : "bg-primary text-white md:bg-white md:text-primary"}`,
            children: f.jsx(i0, {
              size: 20,
              className: "fill-current"
            })
          }), f.jsx("span", {
            className: `text-xl font-bold tracking-tight ${i || r ? "text-primary" : "text-primary md:text-white"}`,
            children: "Cloudyo"
          })]
        }), f.jsx("nav", {
          className: "hidden lg:flex items-center gap-1",
          children: ox.map(m => f.jsxs("div", {
            className: "relative",
            onMouseEnter: () => u(m.name),
            onMouseLeave: () => u(null),
            children: [m.dropdown ? f.jsxs("button", {
              className: `flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${i ? t.startsWith(m.path) ? "text-accent bg-accent/10" : "text-slate-700 hover:text-primary hover:bg-slate-100" : t.startsWith(m.path) ? "text-accent bg-white/10" : "text-white/90 hover:text-white hover:bg-white/10"}`,
              children: [m.name, f.jsx(uA, {
                size: 14,
                className: `transition-transform ${d === m.name ? "rotate-180" : ""}`
              })]
            }) : f.jsx(ve, {
              href: m.path,
              className: `block px-4 py-2 rounded-full text-sm font-medium transition-colors ${i ? t === m.path ? "text-accent bg-accent/10" : "text-slate-700 hover:text-primary hover:bg-slate-100" : t === m.path ? "text-accent bg-white/10" : "text-white/90 hover:text-white hover:bg-white/10"}`,
              children: m.name
            }), m.dropdown && f.jsx(Xv, {
              children: d === m.name && f.jsx(je.div, {
                initial: {
                  opacity: 0,
                  y: 10,
                  scale: .95
                },
                animate: {
                  opacity: 1,
                  y: 0,
                  scale: 1
                },
                exit: {
                  opacity: 0,
                  y: 10,
                  scale: .95
                },
                transition: {
                  duration: .15
                },
                className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden",
                children: f.jsx("div", {
                  className: "p-2",
                  children: m.dropdown.map(g => f.jsxs(ve, {
                    href: g.path,
                    className: "block p-3 rounded-lg hover:bg-slate-50 transition-colors group",
                    children: [f.jsx("div", {
                      className: "font-semibold text-primary group-hover:text-accent transition-colors",
                      children: g.name
                    }), f.jsx("div", {
                      className: "text-xs text-slate-500 mt-1",
                      children: g.desc
                    })]
                  }, g.path))
                })
              })
            })],
            onFocus: () => u(m.name),
            onBlur: event => {
              if (!event.currentTarget.contains(event.relatedTarget)) u(null);
            },
            onKeyDown: event => {
              if (event.key === "Escape") u(null);
            }
          }, m.name))
        }), f.jsx("button", {
          className: `lg:hidden p-2 rounded-md ${i || r ? "text-primary" : "text-white"}`,
          onClick: () => l(!r),
          children: r ? f.jsx(s0, {
            size: 24
          }) : f.jsx(PA, {
            size: 24
          }),
          "aria-label": "Toggle navigation",
          "aria-expanded": r
        })]
      })
    }), f.jsx(Xv, {
      children: r && f.jsx(je.div, {
        initial: {
          opacity: 0,
          height: 0
        },
        animate: {
          opacity: 1,
          height: "100vh"
        },
        exit: {
          opacity: 0,
          height: 0
        },
        className: "fixed inset-0 top-[60px] bg-white z-40 overflow-y-auto",
        children: f.jsx("div", {
          className: "flex flex-col p-6 gap-6",
          children: ox.map(m => f.jsx("div", {
            className: "border-b border-slate-100 pb-4",
            children: m.dropdown ? f.jsxs("div", {
              children: [f.jsx("div", {
                className: "font-bold text-lg text-primary mb-3",
                children: m.name
              }), f.jsx("div", {
                className: "flex flex-col gap-3 pl-4 border-l-2 border-slate-100",
                children: m.dropdown.map(g => f.jsx(ve, {
                  href: g.path,
                  className: `text-sm ${t === g.path ? "text-accent font-semibold" : "text-slate-600"}`,
                  children: g.name
                }, g.path))
              })]
            }) : f.jsx(ve, {
              href: m.path,
              className: `font-bold text-lg block ${t === m.path ? "text-accent" : "text-primary"}`,
              children: m.name
            })
          }, m.name))
        })
      })
    })]
  });
}
function QR() {
  const t = new Date().getFullYear();
  return f.jsx("footer", {
    className: "bg-[#021820] text-slate-300 pt-20 pb-10",
    children: f.jsxs("div", {
      className: "container mx-auto px-4 md:px-6 lg:px-8",
      children: [f.jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16",
        children: [f.jsxs("div", {
          className: "lg:col-span-2",
          children: [f.jsxs(ve, {
            href: "/",
            className: "flex items-center gap-2 mb-6",
            children: [f.jsx("div", {
              className: "w-10 h-10 rounded-md bg-accent flex items-center justify-center text-white",
              children: f.jsx(i0, {
                size: 24,
                className: "fill-current"
              })
            }), f.jsx("span", {
              className: "text-2xl font-bold tracking-tight text-white",
              children: "Cloudyo"
            })]
          }), f.jsx("p", {
            className: "text-slate-400 mb-8 max-w-sm",
            children: "Your trusted partner for cloud technology and software lifecycle management. Navigating enterprise IT procurement, migration, and cost optimization."
          }), f.jsxs("div", {
            className: "flex items-center gap-4",
            children: [f.jsx("span", {
              className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-colors",
              children: f.jsx(QA, {
                size: 18
              })
            }), f.jsx("span", {
              className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-colors",
              children: f.jsx(DA, {
                size: 18
              })
            }), f.jsx("span", {
              className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-colors",
              children: f.jsx(bA, {
                size: 18
              })
            })]
          })]
        }), f.jsxs("div", {
          children: [f.jsx("h4", {
            className: "text-white font-semibold mb-6",
            children: "Expertise"
          }), f.jsxs("ul", {
            className: "flex flex-col gap-4",
            children: [f.jsx("li", {
              children: f.jsx(ve, {
                href: "/expertise/software-procurement",
                className: "hover:text-accent transition-colors",
                children: "Software Procurement"
              })
            }), f.jsx("li", {
              children: f.jsx(ve, {
                href: "/expertise/it-cost-management",
                className: "hover:text-accent transition-colors",
                children: "IT Cost Management"
              })
            }), f.jsx("li", {
              children: f.jsx(ve, {
                href: "/expertise/cloud-services",
                className: "hover:text-accent transition-colors",
                children: "Cloud Services"
              })
            }), f.jsx("li", {
              children: f.jsx(ve, {
                href: "/expertise/data-ai-solutions",
                className: "hover:text-accent transition-colors",
                children: "Data & AI Solutions"
              })
            })]
          })]
        }), f.jsxs("div", {
          children: [f.jsx("h4", {
            className: "text-white font-semibold mb-6",
            children: "Company"
          }), f.jsxs("ul", {
            className: "flex flex-col gap-4",
            children: [f.jsx("li", {
              children: f.jsx(ve, {
                href: "/about",
                className: "hover:text-accent transition-colors",
                children: "About Us"
              })
            }), f.jsx("li", {
              children: f.jsx(ve, {
                href: "/industries",
                className: "hover:text-accent transition-colors",
                children: "Industries"
              })
            }), f.jsx("li", {
              children: f.jsx(ve, {
                href: "/contact",
                className: "hover:text-accent transition-colors",
                children: "Contact"
              })
            })]
          })]
        }), f.jsxs("div", {
          children: [f.jsx("h4", {
            className: "text-white font-semibold mb-6",
            children: "Stay Updated"
          }), f.jsx("p", {
            className: "text-sm text-slate-400 mb-4",
            children: "Get the latest cloud insights delivered to your inbox."
          }), f.jsx(NewsletterForm, {
            kind: "newsletter"
          })]
        })]
      }), f.jsxs("div", {
        className: "border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500",
        children: [f.jsxs("p", {
          children: ["© ", t, " Cloudyo Inc. All rights reserved."]
        }), f.jsxs("div", {
          className: "flex items-center gap-6",
          children: [f.jsx(ve, {
            href: "/privacy",
            className: "hover:text-white transition-colors",
            children: "Privacy Policy"
          }), f.jsx(ve, {
            href: "/terms",
            className: "hover:text-white transition-colors",
            children: "Terms of Service"
          }), f.jsx(ve, {
            href: "/cookies",
            className: "hover:text-white transition-colors",
            children: "Cookie Policy"
          })]
        })]
      })]
    })
  });
}
const Rh = S.forwardRef(({
  className: t,
  ...i
}, s) => f.jsx("div", {
  ref: s,
  className: ft("rounded-xl border bg-card text-card-foreground shadow", t),
  ...i
}));
const Aw = S.forwardRef(({
  className: t,
  ...i
}, s) => f.jsx("div", {
  ref: s,
  className: ft("flex flex-col space-y-1.5 p-6", t),
  ...i
}));
const Ew = S.forwardRef(({
  className: t,
  ...i
}, s) => f.jsx("div", {
  ref: s,
  className: ft("font-semibold leading-none tracking-tight", t),
  ...i
}));
const jw = S.forwardRef(({
  className: t,
  ...i
}, s) => f.jsx("div", {
  ref: s,
  className: ft("text-sm text-muted-foreground", t),
  ...i
}));
const Cw = S.forwardRef(({
  className: t,
  ...i
}, s) => f.jsx("div", {
  ref: s,
  className: ft("flex items-center p-6 pt-0", t),
  ...i
}));
var Mw = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var Hx = xt.createContext && xt.createContext(Mw);
var u4 = ["attr", "size", "title"];
function d4(t, i) {
  if (t == null) return {};
  var s,
    r,
    l = f4(t, i);
  if (Object.getOwnPropertySymbols) {
    var d = Object.getOwnPropertySymbols(t);
    for (r = 0; r < d.length; r++) s = d[r], i.indexOf(s) === -1 && {}.propertyIsEnumerable.call(t, s) && (l[s] = t[s]);
  }
  return l;
}
function f4(t, i) {
  if (t == null) return {};
  var s = {};
  for (var r in t) if ({}.hasOwnProperty.call(t, r)) {
    if (i.indexOf(r) !== -1) continue;
    s[r] = t[r];
  }
  return s;
}
function Nl() {
  return Nl = Object.assign ? Object.assign.bind() : function (t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      for (var r in s) ({}).hasOwnProperty.call(s, r) && (t[r] = s[r]);
    }
    return t;
  }, Nl.apply(null, arguments);
}
function qx(t, i) {
  var s = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(t);
    i && (r = r.filter(function (l) {
      return Object.getOwnPropertyDescriptor(t, l).enumerable;
    })), s.push.apply(s, r);
  }
  return s;
}
function Cl(t) {
  for (var i = 1; i < arguments.length; i++) {
    var s = arguments[i] != null ? arguments[i] : {};
    i % 2 ? qx(Object(s), !0).forEach(function (r) {
      h4(t, r, s[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(s)) : qx(Object(s)).forEach(function (r) {
      Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(s, r));
    });
  }
  return t;
}
function h4(t, i, s) {
  return (i = m4(i)) in t ? Object.defineProperty(t, i, {
    value: s,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[i] = s, t;
}
function m4(t) {
  var i = p4(t, "string");
  return typeof i == "symbol" ? i : i + "";
}
function p4(t, i) {
  if (typeof t != "object" || !t) return t;
  var s = t[Symbol.toPrimitive];
  if (s !== void 0) {
    var r = s.call(t, i);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (i === "string" ? String : Number)(t);
}
function Rw(t) {
  return t && t.map((i, s) => xt.createElement(i.tag, Cl({
    key: s
  }, i.attr), Rw(i.child)));
}
function g4(t) {
  return i => xt.createElement(y4, Nl({
    attr: Cl({}, t.attr)
  }, i), Rw(t.child));
}
function y4(t) {
  var i = s => {
    var {
        attr: r,
        size: l,
        title: d
      } = t,
      u = d4(t, u4),
      m = l || s.size || "1em",
      g;
    return s.className && (g = s.className), t.className && (g = (g ? g + " " : "") + t.className), xt.createElement("svg", Nl({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, s.attr, r, u, {
      className: g,
      style: Cl(Cl({
        color: t.color || s.color
      }, s.style), t.style),
      height: m,
      width: m,
      xmlns: "http://www.w3.org/2000/svg"
    }), d && xt.createElement("title", null, d), t.children);
  };
  return Hx !== void 0 ? xt.createElement(Hx.Consumer, null, s => i(s)) : i(Mw);
}
function Ow(t) {
  return g4({
    attr: {
      role: "img",
      viewBox: "0 0 24 24"
    },
    child: [{
      tag: "path",
      attr: {
        d: "M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-2.821-4.552l-.043.043.006-.05A9.344 9.344 0 0 0 12.19 2.38zm-.358 4.146c1.244-.04 2.518.368 3.486 1.15a5.186 5.186 0 0 1 1.862 4.078v.518c3.53-.07 3.53 5.262 0 5.193h-5.193l-.008.009v-.04H6.785a2.59 2.59 0 0 1-1.067-.23h.001a2.597 2.597 0 1 1 3.437-3.437l3.013-3.012A6.747 6.747 0 0 0 8.11 8.24c.018-.01.04-.026.054-.023a5.186 5.186 0 0 1 3.67-1.69z"
      },
      child: []
    }]
  })(t);
}
const tl = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
const v4 = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: .1
    }
  }
};
function x4() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsxs("section", {
      className: "relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden bg-primary",
      children: [f.jsxs("div", {
        className: "absolute inset-0 z-0",
        children: [f.jsx("img", {
          src: "/hero-bg.png",
          alt: "Abstract cloud technology",
          className: "w-full h-full object-cover opacity-30 mix-blend-overlay"
        }), f.jsx("div", {
          className: "absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40"
        })]
      }), f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 relative z-10",
        children: f.jsx("div", {
          className: "max-w-3xl",
          children: f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: v4,
            children: [f.jsxs(je.div, {
              variants: tl,
              className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-sm font-medium mb-6",
              children: [f.jsx("span", {
                className: "w-2 h-2 rounded-full bg-accent"
              }), "The new standard for enterprise IT"]
            }), f.jsxs(je.h1, {
              variants: tl,
              className: "text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight",
              children: ["Master your ", f.jsx("span", {
                className: "text-accent",
                children: f.jsx(EditableCopy, {
                  index: 0,
                  fallback: "cloud"
                })
              }), ".", f.jsx("br", {}), "Optimize your ", f.jsx("span", {
                className: "text-accent",
                children: f.jsx(EditableCopy, {
                  index: 1,
                  fallback: "software"
                })
              }), "."]
            }), f.jsx(je.p, {
              variants: tl,
              className: "text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed",
              children: f.jsx(EditableCopy, {
                index: 2,
                fallback: "Cloudyo helps enterprises navigate complex software procurement, accelerate cloud migrations, and build AI-ready infrastructure with absolute financial clarity."
              })
            }), f.jsxs(je.div, {
              variants: tl,
              className: "flex flex-col sm:flex-row gap-4",
              children: [f.jsx(qe, {
                size: "lg",
                className: "bg-accent hover:bg-accent/90 text-white h-14 px-8 text-lg rounded-full",
                asChild: !0,
                children: f.jsxs(ve, {
                  href: "/contact",
                  children: ["Talk to an Architect ", f.jsx(wn, {
                    className: "ml-2",
                    size: 20
                  })]
                })
              }), f.jsx(qe, {
                size: "lg",
                variant: "outline",
                className: "bg-transparent border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg rounded-full",
                asChild: !0,
                children: f.jsx(ve, {
                  href: "/expertise",
                  children: f.jsx(EditableCopy, {
                    index: 3,
                    fallback: "Explore Our Services"
                  })
                })
              })]
            })]
          })
        })
      })]
    }), f.jsx("section", {
      className: "py-12 bg-white border-b border-slate-100",
      children: f.jsx("div", {
        className: "container mx-auto px-4",
        children: f.jsx("div", {
          className: "grid grid-cols-2 md:grid-cols-3 gap-8 divide-x divide-slate-100",
          children: [{
            label: "Clients",
            value: "2,000+"
          }, {
            label: "Software Managed",
            value: "$20M+"
          }, {
            label: "Cloud Certifications",
            value: "50+"
          }].map((t, i) => f.jsxs("div", {
            className: "text-center px-4",
            children: [f.jsx("div", {
              className: "text-3xl md:text-4xl font-bold text-primary mb-2",
              children: t.value
            }), f.jsx("div", {
              className: "text-sm md:text-base text-slate-500 font-medium uppercase tracking-wider",
              children: t.label
            })]
          }, i))
        })
      })
    }), f.jsxs("section", {
      className: "py-16 bg-slate-50 overflow-hidden",
      children: [f.jsx("div", {
        className: "container mx-auto px-4 text-center mb-10",
        children: f.jsx("h2", {
          className: "text-slate-500 font-semibold uppercase tracking-widest text-sm",
          children: f.jsx(EditableCopy, {
            index: 4,
            fallback: "Trusted by the world's leading technology providers"
          })
        })
      }), f.jsxs("div", {
        className: "flex justify-center flex-wrap gap-10 md:gap-16 opacity-60 hover:opacity-100 transition-all duration-500 items-center px-4",
        children: [f.jsx("span", {
          className: "font-extrabold text-2xl tracking-tight text-[#FF9900]",
          children: f.jsx(EditableCopy, {
            index: 5,
            fallback: "AWS"
          }),
          role: "img",
          "aria-label": "Amazon Web Services"
        }), f.jsx(Ow, {
          size: 42,
          className: "text-[#4285F4]",
          role: "img",
          "aria-label": "Google Cloud"
        }), f.jsx("span", {
          className: "font-extrabold text-2xl tracking-tight text-[#0089D6]",
          children: f.jsx(EditableCopy, {
            index: 6,
            fallback: "Azure"
          }),
          role: "img",
          "aria-label": "Microsoft Azure"
        })]
      })]
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "text-center max-w-3xl mx-auto mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 7,
              fallback: "Our Core Expertise"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 8,
              fallback: "We provide end-to-end technology solutions to help your enterprise thrive in a cloud-first world."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 gap-8",
          children: [{
            title: "Software Procurement",
            icon: f.jsx(Df, {
              size: 32
            }),
            desc: "Navigate complex licensing agreements, optimize vendor negotiations, and ensure compliance across your entire software estate.",
            path: "/expertise/software-procurement"
          }, {
            title: "IT Cost Management",
            icon: f.jsx(Mf, {
              size: 32
            }),
            desc: "Gain unprecedented visibility into your IT spend. We identify waste, optimize resource allocation, and implement FinOps best practices.",
            path: "/expertise/it-cost-management"
          }, {
            title: "Cloud Services",
            icon: f.jsx(zl, {
              size: 32
            }),
            desc: "Accelerate your digital transformation with secure, scalable, and resilient cloud architectures designed for enterprise workloads.",
            path: "/expertise/cloud-services"
          }, {
            title: "Data & AI Solutions",
            icon: f.jsx(Of, {
              size: 32
            }),
            desc: "Transform raw data into strategic assets. Build AI-ready infrastructure and deploy machine learning models at enterprise scale.",
            path: "/expertise/data-ai-solutions"
          }].map((t, i) => f.jsxs(je.div, {
            initial: {
              opacity: 0,
              y: 20
            },
            whileInView: {
              opacity: 1,
              y: 0
            },
            viewport: {
              once: !0
            },
            transition: {
              duration: .5,
              delay: i * .1
            },
            className: "group relative p-8 md:p-10 rounded-3xl bg-slate-50 hover:bg-primary transition-colors duration-500 overflow-hidden",
            children: [f.jsx("div", {
              className: "absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110 text-white",
              children: t.icon
            }), f.jsx("div", {
              className: "w-14 h-14 rounded-2xl bg-white group-hover:bg-white/10 flex items-center justify-center text-accent group-hover:text-accent mb-8 shadow-sm transition-colors",
              children: t.icon
            }), f.jsx("h3", {
              className: "text-2xl font-bold text-primary group-hover:text-white mb-4 transition-colors",
              children: t.title
            }), f.jsx("p", {
              className: "text-slate-600 group-hover:text-slate-300 mb-8 transition-colors line-clamp-3",
              children: t.desc
            }), f.jsxs(ve, {
              href: t.path,
              className: "inline-flex items-center text-primary group-hover:text-accent font-semibold transition-colors",
              children: ["Learn more ", f.jsx(wn, {
                size: 16,
                className: "ml-2 transform group-hover:translate-x-1 transition-transform"
              })]
            })]
          }, i))
        })]
      })
    }), f.jsx("section", {
      className: "py-24 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "max-w-3xl mx-auto",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold mb-6",
            children: f.jsx(EditableCopy, {
              index: 9,
              fallback: "Why enterprises choose Cloudyo"
            })
          }), f.jsx("p", {
            className: "text-slate-300 text-lg mb-8 leading-relaxed",
            children: f.jsx(EditableCopy, {
              index: 10,
              fallback: "We combine deep technical expertise with sharp commercial acumen. While others just sell licenses, we architect solutions that drive real business value and sustainable growth."
            })
          }), f.jsx("ul", {
            className: "space-y-6",
            children: ["Vendor-agnostic advisory that puts your interests first", "Deep technical bench of certified cloud architects", "Proven frameworks for cost optimization and FinOps", "Global reach with localized support and compliance"].map((t, i) => f.jsxs("li", {
              className: "flex items-start gap-4",
              children: [f.jsx("div", {
                className: "mt-1 bg-accent/20 rounded-full p-1 text-accent",
                children: f.jsx(Fn, {
                  size: 20
                })
              }), f.jsx("span", {
                className: "text-lg text-slate-200",
                children: t
              })]
            }, i))
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-4xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 11,
            fallback: "Ready to optimize your IT estate?"
          })
        }), f.jsx("p", {
          className: "text-xl text-slate-600 max-w-2xl mx-auto mb-10",
          children: f.jsx(EditableCopy, {
            index: 12,
            fallback: "Let's discuss how Cloudyo can help you reduce costs, mitigate risks, and accelerate your digital transformation journey."
          })
        }), f.jsxs("div", {
          className: "flex flex-col sm:flex-row justify-center gap-4",
          children: [f.jsx(qe, {
            size: "lg",
            className: "bg-accent hover:bg-accent/90 text-white h-14 px-8 text-lg rounded-full",
            asChild: !0,
            children: f.jsx(ve, {
              href: "/contact",
              children: f.jsx(EditableCopy, {
                index: 13,
                fallback: "Contact an Expert"
              })
            })
          }), f.jsx(qe, {
            size: "lg",
            variant: "outline",
            className: "h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-slate-50",
            asChild: !0,
            children: f.jsx(ve, {
              href: "/about",
              children: f.jsx(EditableCopy, {
                index: 14,
                fallback: "Learn More About Us"
              })
            })
          })]
        })]
      })
    })]
  });
}
const b4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function w4() {
  const t = [{
    title: "Software Procurement",
    icon: f.jsx(Df, {
      size: 40
    }),
    desc: "Navigate complex licensing agreements, optimize vendor negotiations, and ensure compliance across your entire software estate.",
    path: "/expertise/software-procurement",
    features: ["Vendor Negotiation", "License Optimization", "Compliance Audits"]
  }, {
    title: "IT Cost Management",
    icon: f.jsx(Mf, {
      size: 40
    }),
    desc: "Gain unprecedented visibility into your IT spend. We identify waste, optimize resource allocation, and implement FinOps best practices.",
    path: "/expertise/it-cost-management",
    features: ["Cloud FinOps", "Spend Analytics", "Resource Rightsizing"]
  }, {
    title: "Cloud Services",
    icon: f.jsx(zl, {
      size: 40
    }),
    desc: "Accelerate your digital transformation with secure, scalable, and resilient cloud architectures designed for enterprise workloads.",
    path: "/expertise/cloud-services",
    features: ["Cloud Migration", "Architecture Design", "Managed Services"]
  }, {
    title: "Data & AI Solutions",
    icon: f.jsx(Of, {
      size: 40
    }),
    desc: "Transform raw data into strategic assets. Build AI-ready infrastructure and deploy machine learning models at enterprise scale.",
    path: "/expertise/data-ai-solutions",
    features: ["Data Engineering", "AI Strategy", "MLOps"]
  }];
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs(je.div, {
          initial: "hidden",
          animate: "visible",
          variants: b4,
          className: "max-w-3xl",
          children: [f.jsx("h1", {
            className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
            children: f.jsx(EditableCopy, {
              index: 0,
              fallback: "Our Expertise"
            })
          }), f.jsx("p", {
            className: "text-xl text-slate-300 leading-relaxed",
            children: f.jsx(EditableCopy, {
              index: 1,
              fallback: "We provide comprehensive solutions across the entire technology lifecycle, helping enterprises optimize costs, accelerate innovation, and build resilient infrastructure."
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 gap-8",
          children: t.map((i, s) => f.jsxs(je.div, {
            initial: {
              opacity: 0,
              y: 20
            },
            whileInView: {
              opacity: 1,
              y: 0
            },
            viewport: {
              once: !0
            },
            transition: {
              duration: .5,
              delay: s * .1
            },
            className: "flex flex-col h-full p-8 md:p-10 rounded-3xl border border-slate-100 bg-slate-50 hover:shadow-xl transition-shadow duration-500",
            children: [f.jsx("div", {
              className: "w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-8",
              children: i.icon
            }), f.jsx("h2", {
              className: "text-3xl font-bold text-primary mb-4",
              children: i.title
            }), f.jsx("p", {
              className: "text-lg text-slate-600 mb-8 flex-grow",
              children: i.desc
            }), f.jsx("div", {
              className: "mb-8",
              children: f.jsx("ul", {
                className: "space-y-3",
                children: i.features.map((r, l) => f.jsxs("li", {
                  className: "flex items-center text-slate-700 font-medium",
                  children: [f.jsx("div", {
                    className: "w-1.5 h-1.5 rounded-full bg-accent mr-3"
                  }), r]
                }, l))
              })
            }), f.jsx(qe, {
              className: "bg-primary hover:bg-primary/90 text-white w-full md:w-auto self-start rounded-full px-6",
              asChild: !0,
              children: f.jsxs(ve, {
                href: i.path,
                children: ["Explore ", i.title]
              })
            })]
          }, s))
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-3xl md:text-4xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 2,
            fallback: "Need a custom solution?"
          })
        }), f.jsx("p", {
          className: "text-xl text-slate-600 max-w-2xl mx-auto mb-10",
          children: f.jsx(EditableCopy, {
            index: 3,
            fallback: "Every enterprise has unique challenges. Our architects will work with you to design a solution tailored to your specific business goals."
          })
        }), f.jsx(qe, {
          size: "lg",
          className: "bg-accent hover:bg-accent/90 text-white h-14 px-8 text-lg rounded-full",
          asChild: !0,
          children: f.jsx(ve, {
            href: "/contact",
            children: f.jsx(EditableCopy, {
              index: 4,
              fallback: "Talk to an Architect"
            })
          })
        })]
      })
    })]
  });
}
const S4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function T4() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: [f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: S4,
            children: [f.jsxs("div", {
              className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-sm font-medium mb-6",
              children: [f.jsx(Df, {
                size: 16
              }), " Our Expertise"]
            }), f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "Software Procurement"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Navigate complex licensing agreements, optimize vendor negotiations, and ensure compliance across your entire software estate with Cloudyo's expert advisory."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "/contact?topic=Software%20Procurement%20Advisory",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Schedule an Assessment"
                })
              })
            })]
          }), f.jsxs(je.div, {
            initial: {
              opacity: 0,
              scale: .9
            },
            animate: {
              opacity: 1,
              scale: 1
            },
            transition: {
              duration: .6,
              delay: .2
            },
            className: "relative rounded-3xl bg-white/5 border border-white/10 p-10 flex flex-col justify-center items-center gap-8",
            children: [f.jsxs("div", {
              className: "text-center",
              children: [f.jsx("div", {
                className: "text-7xl font-bold text-accent mb-3",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "30%"
                })
              }), f.jsx("div", {
                className: "text-xl text-slate-300",
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Average savings on software renewals"
                })
              })]
            }), f.jsx("div", {
              className: "w-full space-y-4",
              children: ["Vendor Negotiation", "License Optimization", "Compliance & Audits"].map((t, i) => f.jsxs("div", {
                className: "flex items-center gap-3",
                children: [f.jsx("div", {
                  className: "w-2 h-2 rounded-full bg-accent shrink-0"
                }), f.jsx("div", {
                  className: "flex-1 h-10 rounded-lg bg-white/10 flex items-center px-4",
                  children: f.jsx("span", {
                    className: "text-sm text-slate-300",
                    children: t
                  })
                })]
              }, i))
            })]
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "max-w-3xl mx-auto text-center mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 5,
              fallback: "Stop overpaying for underutilized software"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Enterprise software licensing is intentionally complex. Our procurement experts sit on your side of the table, bringing proprietary benchmark data and ex-vendor experience to secure the best possible commercial terms."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-8",
          children: [{
            title: "Vendor Negotiation",
            desc: "We lead or support your negotiations with major publishers like Microsoft, Oracle, SAP, and Salesforce using proprietary pricing intelligence."
          }, {
            title: "License Optimization",
            desc: "Identify shelfware, overlap, and misconfigured licensing tiers to dramatically reduce your renewal costs before you sign."
          }, {
            title: "Compliance & Audits",
            desc: "Proactively manage compliance risk and defend your enterprise during publisher audits with expert representation."
          }].map((t, i) => f.jsxs("div", {
            className: "p-8 rounded-2xl bg-slate-50 border border-slate-100",
            children: [f.jsx("div", {
              className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: f.jsx(Fn, {
                size: 24
              })
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-4",
              children: t.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: t.desc
            })]
          }, i))
        })]
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-3xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 7,
            fallback: "Ready to optimize your contracts?"
          })
        }), f.jsx(qe, {
          size: "lg",
          className: "bg-primary hover:bg-primary/90 text-white rounded-full px-8",
          asChild: !0,
          children: f.jsxs(ve, {
            href: "/contact?topic=Software%20Procurement%20Advisory",
            children: ["Speak with a Procurement Specialist ", f.jsx(wn, {
              className: "ml-2",
              size: 16
            })]
          })
        })]
      })
    })]
  });
}
const A4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function E4() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: [f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: A4,
            children: [f.jsxs("div", {
              className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-sm font-medium mb-6",
              children: [f.jsx(Mf, {
                size: 16
              }), " Our Expertise"]
            }), f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "IT Cost Management"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Gain unprecedented visibility into your IT spend. We identify waste, optimize resource allocation, and implement FinOps best practices."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "/contact?topic=IT%20Cost%20Management%20%2F%20FinOps",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Schedule a FinOps Assessment"
                })
              })
            })]
          }), f.jsxs(je.div, {
            initial: {
              opacity: 0,
              scale: .9
            },
            animate: {
              opacity: 1,
              scale: 1
            },
            transition: {
              duration: .6,
              delay: .2
            },
            className: "relative rounded-3xl overflow-hidden aspect-video bg-white/5 border border-white/10 p-8 flex flex-col justify-center items-center",
            children: [f.jsxs("div", {
              className: "text-center mb-8",
              children: [f.jsx("div", {
                className: "text-6xl font-bold text-accent mb-2",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "25%"
                })
              }), f.jsx("div", {
                className: "text-xl text-slate-300",
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Average reduction in cloud spend"
                })
              })]
            }), f.jsx("div", {
              className: "w-full flex items-end gap-2 h-24",
              children: [40, 70, 50, 90, 60, 100, 30].map((t, i) => f.jsx("div", {
                className: "flex-1 bg-accent/40 rounded-t-sm",
                style: {
                  height: `${t}%`,
                  animationDelay: `${i * .1}s`
                }
              }, i))
            })]
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "max-w-3xl mx-auto text-center mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 5,
              fallback: "Take control of your cloud unit economics"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Cloud agility often comes at the cost of financial control. Our FinOps practitioners help you bridge the gap between engineering speed and financial accountability."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-8",
          children: [{
            title: "Cloud FinOps",
            desc: "Implement cultural practice and financial management discipline to maximize business value in hybrid and multi-cloud environments."
          }, {
            title: "Spend Analytics",
            desc: "Get granular visibility into where every dollar goes. We map technical resources directly to business units, products, and features."
          }, {
            title: "Resource Rightsizing",
            desc: "Continuously match your infrastructure provisioning to actual workload demands without compromising performance or reliability."
          }].map((t, i) => f.jsxs("div", {
            className: "p-8 rounded-2xl bg-slate-50 border border-slate-100",
            children: [f.jsx("div", {
              className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: f.jsx(Fn, {
                size: 24
              })
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-4",
              children: t.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: t.desc
            })]
          }, i))
        })]
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-3xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 7,
            fallback: "Ready to optimize your IT spend?"
          })
        }), f.jsx(qe, {
          size: "lg",
          className: "bg-primary hover:bg-primary/90 text-white rounded-full px-8",
          asChild: !0,
          children: f.jsxs(ve, {
            href: "/contact?topic=IT%20Cost%20Management%20%2F%20FinOps",
            children: ["Speak with a FinOps Expert ", f.jsx(wn, {
              className: "ml-2",
              size: 16
            })]
          })
        })]
      })
    })]
  });
}
const j4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function N4() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: [f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: j4,
            children: [f.jsxs("div", {
              className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-sm font-medium mb-6",
              children: [f.jsx(zl, {
                size: 16
              }), " Our Expertise"]
            }), f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "Cloud Services"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Accelerate your digital transformation with secure, scalable, and resilient cloud architectures designed for enterprise workloads."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "/contact?topic=Cloud%20Migration%20Services",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Talk to a Cloud Architect"
                })
              })
            })]
          }), f.jsxs(je.div, {
            initial: {
              opacity: 0,
              scale: .9
            },
            animate: {
              opacity: 1,
              scale: 1
            },
            transition: {
              duration: .6,
              delay: .2
            },
            className: "relative rounded-3xl overflow-hidden aspect-video bg-white/5 border border-white/10 p-8 flex flex-col justify-center items-center",
            children: [f.jsxs("div", {
              className: "text-center mb-8",
              children: [f.jsx("div", {
                className: "text-6xl font-bold text-accent mb-2",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "99.99%"
                })
              }), f.jsx("div", {
                className: "text-xl text-slate-300",
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Target architecture uptime"
                })
              })]
            }), f.jsx("div", {
              className: "flex gap-4",
              children: [1, 2, 3].map(t => f.jsx("div", {
                className: "w-16 h-16 rounded-full border-2 border-accent/50 flex items-center justify-center",
                children: f.jsx("div", {
                  className: "w-8 h-8 rounded-full bg-accent animate-pulse",
                  style: {
                    animationDelay: `${t * .3}s`
                  }
                })
              }, t))
            })]
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "max-w-3xl mx-auto text-center mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 5,
              fallback: "Modernize your infrastructure"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Whether you're migrating legacy applications or building cloud-native solutions, our certified architects design for security, performance, and operational excellence."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-8",
          children: [{
            title: "Cloud Migration",
            desc: "De-risk your journey to the cloud with our proven migration frameworks. We handle the complexity of moving legacy workloads with zero downtime."
          }, {
            title: "Architecture Design",
            desc: "Build secure, resilient, and highly available architectures that align with AWS Well-Architected and Azure Cloud Adoption frameworks."
          }, {
            title: "Managed Services",
            desc: "Offload the operational burden. We provide 24/7 monitoring, security patching, and proactive maintenance for your cloud environments."
          }].map((t, i) => f.jsxs("div", {
            className: "p-8 rounded-2xl bg-slate-50 border border-slate-100",
            children: [f.jsx("div", {
              className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: f.jsx(Fn, {
                size: 24
              })
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-4",
              children: t.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: t.desc
            })]
          }, i))
        })]
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-3xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 7,
            fallback: "Ready to transform your infrastructure?"
          })
        }), f.jsx(qe, {
          size: "lg",
          className: "bg-primary hover:bg-primary/90 text-white rounded-full px-8",
          asChild: !0,
          children: f.jsxs(ve, {
            href: "/contact?topic=Cloud%20Migration%20Services",
            children: ["Speak with a Cloud Expert ", f.jsx(wn, {
              className: "ml-2",
              size: 16
            })]
          })
        })]
      })
    })]
  });
}
const C4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function M4() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: [f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: C4,
            children: [f.jsxs("div", {
              className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-sm font-medium mb-6",
              children: [f.jsx(Of, {
                size: 16
              }), " Our Expertise"]
            }), f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "Data & AI Solutions"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Transform raw data into strategic assets. Build AI-ready infrastructure and deploy machine learning models at enterprise scale."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "/contact?topic=Data%20%26%20AI%20Solutions",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Explore AI Solutions"
                })
              })
            })]
          }), f.jsxs(je.div, {
            initial: {
              opacity: 0,
              scale: .9
            },
            animate: {
              opacity: 1,
              scale: 1
            },
            transition: {
              duration: .6,
              delay: .2
            },
            className: "relative rounded-3xl bg-white/5 border border-white/10 p-10 flex flex-col justify-center gap-6",
            children: [f.jsxs("div", {
              className: "text-center",
              children: [f.jsx("div", {
                className: "text-7xl font-bold text-accent mb-3",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "3x"
                })
              }), f.jsx("div", {
                className: "text-xl text-slate-300",
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Faster time-to-insight with AI-ready data platforms"
                })
              })]
            }), f.jsx("div", {
              className: "w-full space-y-4",
              children: ["Data Engineering", "AI Strategy", "MLOps"].map((t, i) => f.jsxs("div", {
                className: "flex items-center gap-3",
                children: [f.jsx("div", {
                  className: "w-2 h-2 rounded-full bg-accent shrink-0"
                }), f.jsx("div", {
                  className: "flex-1 h-10 rounded-lg bg-white/10 flex items-center px-4",
                  children: f.jsx("span", {
                    className: "text-sm text-slate-300",
                    children: t
                  })
                })]
              }, i))
            })]
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "max-w-3xl mx-auto text-center mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 5,
              fallback: "Unlock the value of your data"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Before you can scale AI, you need a solid data foundation. We help enterprises build modern data platforms that power intelligent applications."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-8",
          children: [{
            title: "Data Engineering",
            desc: "Design and build scalable data lakes, warehouses, and pipelines that unify siloed information into a single source of truth."
          }, {
            title: "AI Strategy",
            desc: "Identify high-impact use cases for generative AI and machine learning that drive operational efficiency and new revenue streams."
          }, {
            title: "MLOps",
            desc: "Deploy, monitor, and maintain machine learning models in production with robust CI/CD practices designed for data science."
          }].map((t, i) => f.jsxs("div", {
            className: "p-8 rounded-2xl bg-slate-50 border border-slate-100",
            children: [f.jsx("div", {
              className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: f.jsx(Fn, {
                size: 24
              })
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-4",
              children: t.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: t.desc
            })]
          }, i))
        })]
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 text-center",
        children: [f.jsx("h2", {
          className: "text-3xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 7,
            fallback: "Ready to become AI-driven?"
          })
        }), f.jsx(qe, {
          size: "lg",
          className: "bg-primary hover:bg-primary/90 text-white rounded-full px-8",
          asChild: !0,
          children: f.jsxs(ve, {
            href: "/contact?topic=Data%20%26%20AI%20Solutions",
            children: ["Speak with a Data Architect ", f.jsx(wn, {
              className: "ml-2",
              size: 16
            })]
          })
        })]
      })
    })]
  });
}
const R4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function O4() {
  const t = [{
    title: "Financial Services",
    icon: f.jsx(oA, {
      size: 32
    }),
    desc: "Meet stringent regulatory requirements while accelerating digital innovation. We help banks and fintechs secure their cloud environments and optimize IT costs."
  }, {
    title: "Healthcare",
    icon: f.jsx(CA, {
      size: 32
    }),
    desc: "Modernize patient care with compliant, HIPAA-ready cloud infrastructure that enables secure data sharing and advanced analytics."
  }, {
    title: "Manufacturing",
    icon: f.jsx(vA, {
      size: 32
    }),
    desc: "Connect factory floors to the cloud. Build resilient supply chain data platforms and implement AI for predictive maintenance."
  }, {
    title: "Retail & E-commerce",
    icon: f.jsx(GA, {
      size: 32
    }),
    desc: "Scale dynamically during peak seasons. Optimize your cloud footprint to handle variable workloads while controlling unit costs."
  }, {
    title: "Education",
    icon: f.jsx(AA, {
      size: 32
    }),
    desc: "Enable remote learning and modernize campus IT infrastructure with cost-effective, scalable software procurement strategies."
  }, {
    title: "Public Sector",
    icon: f.jsx(RA, {
      size: 32
    }),
    desc: "Deliver better citizen services with secure, compliant government cloud architectures. Navigate complex public procurement vehicles."
  }];
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: [f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: R4,
            className: "max-w-3xl",
            children: [f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "Industries We Serve"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Deep domain expertise meets technical excellence. We build tailored cloud and procurement strategies for the world's most demanding sectors."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "/contact",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Discuss Your Industry Needs"
                })
              })
            })]
          }), f.jsx(je.div, {
            initial: {
              opacity: 0
            },
            animate: {
              opacity: 1
            },
            transition: {
              duration: 1
            },
            className: "relative rounded-3xl overflow-hidden aspect-[4/3] bg-white/5 border border-white/10",
            children: f.jsx("img", {
              src: "/industries-visual.png",
              alt: "Industries visualization",
              className: "w-full h-full object-cover"
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
          children: t.map((i, s) => f.jsxs(je.div, {
            initial: {
              opacity: 0,
              y: 20
            },
            whileInView: {
              opacity: 1,
              y: 0
            },
            viewport: {
              once: !0
            },
            transition: {
              duration: .5,
              delay: s * .1
            },
            className: "group p-8 rounded-3xl bg-slate-50 hover:bg-primary transition-colors duration-300 border border-slate-100",
            children: [f.jsx("div", {
              className: "w-14 h-14 rounded-xl bg-white group-hover:bg-white/10 flex items-center justify-center text-primary group-hover:text-accent mb-6 shadow-sm transition-colors",
              children: i.icon
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary group-hover:text-white mb-4 transition-colors",
              children: i.title
            }), f.jsx("p", {
              className: "text-slate-600 group-hover:text-slate-300 transition-colors",
              children: i.desc
            })]
          }, s))
        })
      })
    })]
  });
}
const D4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function Pd({
  name: t,
  color: i
}) {
  return f.jsx("span", {
    className: "inline-block font-extrabold text-3xl tracking-tight",
    style: {
      color: i
    },
    children: t
  });
}
function z4() {
  const t = [{
    name: "Microsoft",
    icon: f.jsx(Pd, {
      name: "Microsoft",
      color: "#00a4ef"
    }),
    desc: "Maximize the value of your Microsoft investment. From M365 licensing optimization to complex Enterprise Agreement negotiations.",
    tier: "Gold Partner"
  }, {
    name: "AWS",
    icon: f.jsx(Pd, {
      name: "AWS",
      color: "#FF9900"
    }),
    desc: "Accelerate your AWS journey. We provide architecture design, migration services, and deep FinOps expertise for AWS environments.",
    tier: ""
  }, {
    name: "Google Cloud",
    icon: f.jsx(Ow, {
      size: 56,
      className: "text-[#4285F4]",
      role: "img",
      "aria-label": "Google Cloud"
    }),
    desc: "Harness the power of GCP's data and AI capabilities. We help you design, deploy, and optimize workloads on Google Cloud.",
    tier: ""
  }, {
    name: "Microsoft Azure",
    icon: f.jsx(Pd, {
      name: "Azure",
      color: "#0089D6"
    }),
    desc: "Seamlessly migrate and modernize applications on Azure. Our experts ensure your Azure footprint is secure and cost-optimized.",
    tier: ""
  }];
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 text-center max-w-4xl",
        children: f.jsxs(je.div, {
          initial: "hidden",
          animate: "visible",
          variants: D4,
          children: [f.jsx("h1", {
            className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
            children: f.jsx(EditableCopy, {
              index: 0,
              fallback: "Our Cloud Partners"
            })
          }), f.jsx("p", {
            className: "text-xl text-slate-300 leading-relaxed mb-8",
            children: f.jsx(EditableCopy, {
              index: 1,
              fallback: "We hold top-tier partnerships and certifications with the world's leading technology providers, enabling us to deliver independent, expert guidance."
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
          children: t.map((i, s) => f.jsxs(je.div, {
            initial: {
              opacity: 0,
              y: 20
            },
            whileInView: {
              opacity: 1,
              y: 0
            },
            viewport: {
              once: !0
            },
            transition: {
              duration: .5,
              delay: s * .1
            },
            className: "flex flex-col p-8 rounded-3xl border border-slate-200 bg-white hover:shadow-xl transition-all duration-300 group",
            "data-testid": `card-provider-${s}`,
            children: [f.jsxs("div", {
              className: "flex items-center justify-between mb-8",
              children: [f.jsx("div", {
                className: "grayscale group-hover:grayscale-0 transition-all duration-500 h-14 flex items-center",
                children: i.icon
              }), i.tier && f.jsx("span", {
                className: "px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase tracking-wider",
                children: i.tier
              })]
            }), f.jsx("h3", {
              className: "text-2xl font-bold text-primary mb-4",
              children: i.name
            }), f.jsx("p", {
              className: "text-slate-600 flex-grow mb-8",
              children: i.desc
            }), f.jsxs(ve, {
              href: "/contact",
              className: "text-primary font-semibold hover:text-accent transition-colors",
              "data-testid": `link-provider-contact-${s}`,
              children: ["Discuss your ", i.name, " strategy →"]
            })]
          }, s))
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 text-center max-w-3xl",
        children: f.jsxs(je.div, {
          initial: {
            opacity: 0,
            y: 20
          },
          whileInView: {
            opacity: 1,
            y: 0
          },
          viewport: {
            once: !0
          },
          children: [f.jsx("h2", {
            className: "text-3xl md:text-4xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 2,
              fallback: "Certified. Trusted. Independent."
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600 mb-10",
            children: f.jsx(EditableCopy, {
              index: 3,
              fallback: "Our multi-vendor independence means we always recommend the best solution for your needs, not the one with the biggest margin. Our advisors are certified across all major platforms."
            })
          }), f.jsx(qe, {
            size: "lg",
            className: "bg-accent hover:bg-accent/90 text-white h-14 px-8 rounded-full",
            asChild: !0,
            children: f.jsx(ve, {
              href: "/contact",
              "data-testid": "button-partner-cta",
              children: f.jsx(EditableCopy, {
                index: 4,
                fallback: "Talk to a Cloud Expert"
              })
            })
          })]
        })
      })
    })]
  });
}
const Ml = [{
  slug: "2025-guide-cloud-finops",
  type: "blog",
  title: "The 2025 Guide to Cloud FinOps",
  desc: "Strategies for controlling cloud spend in an era of AI adoption.",
  date: "Oct 12, 2024",
  readTime: "8 min read",
  author: "James Lau",
  authorRole: "Principal Cloud Architect, Cloudyo",
  keyTakeaways: ["AI workloads can inflate cloud bills by 3–5× if not governed from day one", "Tagging hygiene and showback reports drive accountability at team level", "Reserved Instances and Savings Plans typically yield 30–50% savings vs on-demand", "FinOps is not just a cost exercise — it unlocks speed by removing financial friction"],
  sections: [{
    heading: "Why FinOps Has Never Mattered More",
    body: ["Enterprise cloud spend surpassed $600 billion globally in 2024, and analyst firms project it will cross $1 trillion by 2028. AI workloads are the primary driver of this acceleration — GPU-backed compute is orders of magnitude more expensive than general-purpose instances, and development teams are spinning up experiments faster than finance teams can track them.", "Without a structured FinOps practice, organisations are flying blind. Bills arrive at month-end, engineering teams have no feedback loop on cost, and platform owners are left scrambling to explain variance. The answer is not budget cuts — it is real-time visibility, shared accountability, and a culture that treats cloud spend as a first-class engineering metric."]
  }, {
    heading: "The Three Pillars of Mature FinOps",
    body: ["A sustainable FinOps programme rests on three interlocking capabilities:"],
    bullets: ["Visibility: Granular cost allocation using resource tags, linked accounts, and cost anomaly detection. Every dollar must be attributable to a team, product, or project.", "Accountability: Showback and chargeback models that surface unit economics to engineering managers in real time — not in a quarterly spreadsheet.", "Optimisation: A continuous improvement cycle covering right-sizing, commitment discounts (Reserved Instances, Savings Plans, CUDs), and architectural refactoring to eliminate waste."]
  }, {
    heading: "Governing AI and GPU Spend",
    body: ["The most common FinOps failure mode in 2025 is the runaway AI experiment. A data science team provisions a p4d.24xlarge instance for model training, forgets to terminate it over a weekend, and returns on Monday to a $14,000 surprise.", "Effective AI spend governance requires: automated instance scheduler policies, budget alerts with hard stops, a centralised ML platform team that brokers GPU access, and per-project cost attribution from the moment a notebook is launched."]
  }, {
    heading: "Commitment Strategies That Actually Work",
    body: ["Reserved Instances and Savings Plans remain the highest-leverage cost lever available, yet many enterprises are under-committed because finance and engineering cannot agree on a baseline. The best practice is to commit on the stable, predictable baseline at the account or organisation level, and leave variable burst capacity on-demand.", "Cloudyo's benchmark data shows that enterprises with mature commitment coverage (>60% of spend on commitments) achieve an average effective discount of 38% versus on-demand equivalents. For a $5M annual cloud bill, that represents $1.9M in recoverable savings."]
  }, {
    heading: "Building a FinOps Centre of Excellence",
    body: ["A FinOps Centre of Excellence (CoE) does not need to be large — three to five dedicated practitioners embedded across engineering, finance, and architecture can transform an organisation's cost posture within a quarter.", "The CoE's mandate is to establish standards (tagging policy, commitment review cadence, anomaly response SLA), build tooling integrations (cloud cost platforms, Slack alerting, Jira tickets for waste), and run monthly allocation reviews with each product team."]
  }]
}, {
  slug: "financial-services-oracle-renewal",
  type: "case-study",
  title: "Financial Services: $12M Saved on Oracle Renewal",
  desc: "How our procurement experts secured landmark savings for a global bank.",
  date: "Sep 28, 2024",
  readTime: "6 min read",
  author: "Rachel Ng",
  authorRole: "Director, Software Procurement Advisory",
  keyTakeaways: ["$12M in savings secured across a 3-year Oracle enterprise agreement", "Audit exposure eliminated before contract signature", "Cloudyo's ex-Oracle advisors brought insider pricing intelligence to the table", "Deal completed 6 weeks ahead of the bank's renewal deadline"],
  sections: [{
    heading: "Client Background",
    body: ["Our client is a Tier-1 bank headquartered in Asia Pacific, with operations across 18 markets and an Oracle estate spanning database, middleware, and ERP. With approximately 12,000 Oracle processor licences in deployment, the annual maintenance bill alone exceeded $8M.", "The bank's IT leadership had managed Oracle renewals internally for over a decade — a process that had served them adequately when the estate was static. By 2024, a combination of cloud migrations, M&A activity, and virtualisation projects had created significant compliance uncertainty."]
  }, {
    heading: "The Challenge",
    body: ["Six months before the enterprise agreement renewal date, Oracle's licence compliance team initiated a pre-renewal audit. The timing was not coincidental — Oracle regularly uses audit leverage to reset commercial conversations on more favourable terms.", "The bank's internal team identified three areas of potential exposure: uncounted processor cores in a virtualised environment, database options deployed beyond their licensed footprint, and a recent acquisition that had brought additional Oracle installations into scope without corresponding licences."]
  }, {
    heading: "How Cloudyo Engaged",
    body: ["Cloudyo was engaged on a success-fee basis, with our procurement advisory team taking full ownership of the Oracle relationship. Our team included two former Oracle licence compliance managers who understood the audit methodology from the inside.", "Over eight weeks, we conducted an independent licence position analysis, identified defensible positions in the virtualisation findings, and prepared a detailed compliance response that reduced the bank's stated exposure by 71% before negotiations commenced."]
  }, {
    heading: "Negotiation Strategy and Outcome",
    body: ["Armed with accurate licence data, a clear understanding of Oracle's discount authority structure, and proprietary benchmark data on comparable deals, Cloudyo led a structured negotiation across three rounds. We introduced competitive alternatives — including open-source database migration paths — to create genuine leverage.", "The final agreement delivered $12M in savings over three years versus Oracle's opening position, eliminated the audit risk entirely through a contractual clean-up clause, and secured a price lock protecting against Oracle's annual maintenance uplift for the duration of the term."]
  }, {
    heading: "What Made the Difference",
    body: ["The bank's previous renewal had been conducted without independent advice. The single most important factor in this engagement was the quality of the licence position analysis — knowing exactly what you own and what you use is the foundation of any successful negotiation.", "Oracle's commercial teams are highly trained and negotiate hundreds of enterprise deals each year. Bringing advisors who have operated on that side of the table is not just an advantage — in deals of this complexity, it is essential."]
  }]
}, {
  slug: "ai-ready-data-architecture",
  type: "whitepaper",
  title: "Building AI-Ready Data Architecture",
  desc: "A technical blueprint for modernizing enterprise data platforms.",
  date: "Sep 15, 2024",
  readTime: "12 min read",
  author: "Wei Chen",
  authorRole: "Head of Data & AI Practice, Cloudyo",
  keyTakeaways: ["Most enterprises are not AI-blocked by model capability — they are blocked by data quality and accessibility", "The data lakehouse pattern unifies batch and streaming data for ML workloads at scale", "Data mesh principles enable domain ownership without sacrificing governance", "Vector databases and semantic search are now core infrastructure requirements for GenAI"],
  sections: [{
    heading: "Why Most AI Projects Fail Before They Start",
    body: ["Industry surveys consistently show that fewer than 20% of enterprise AI pilots reach production. The bottleneck is rarely the model — foundation models from OpenAI, Anthropic, Google, and others have made advanced AI capability broadly accessible. The bottleneck is data.", "Siloed data warehouses, inconsistent schemas, undocumented pipelines, and poor data quality create a tax on every AI initiative. Data scientists spend 60–80% of their time on data preparation rather than model development. Solving this requires architectural investment, not more data science headcount."]
  }, {
    heading: "The Lakehouse: A Unified Foundation",
    body: ["The data lakehouse pattern, pioneered by Databricks and now supported across all major cloud providers, combines the low-cost storage flexibility of a data lake with the query performance and ACID guarantees of a data warehouse.", "For AI workloads specifically, the lakehouse provides a unified storage tier for both structured data (used in traditional analytics) and unstructured data (documents, images, audio — the raw material for LLM fine-tuning and RAG applications). Open table formats such as Apache Iceberg and Delta Lake are the recommended standards for enterprise deployments."]
  }, {
    heading: "Data Mesh and Domain Ownership",
    body: ["As organisations scale, centralised data engineering teams become bottlenecks. The data mesh paradigm distributes data ownership to domain teams — customer, product, finance, operations — each of which owns, publishes, and maintains its own data products.", "A federated governance layer provides the guardrails: shared schemas for cross-domain joins, unified access control policies, and a data catalogue that makes assets discoverable. Platform engineering teams provide the infrastructure toolkit (pipelines, quality checks, cataloguing) as a self-service capability."]
  }, {
    heading: "Vector Databases: The GenAI Infrastructure Layer",
    body: ["Retrieval-Augmented Generation (RAG) has emerged as the dominant pattern for grounding LLM responses in enterprise knowledge bases. RAG requires a vector database — a specialised store that indexes high-dimensional embeddings and supports semantic similarity search at scale.", "Production deployments should evaluate Pinecone, Weaviate, Milvus, and the native vector search capabilities built into PostgreSQL (pgvector) and the major cloud data platforms. Selection criteria include latency requirements, scale, hybrid search capability (dense + sparse), and integration with existing data infrastructure."]
  }, {
    heading: "MLOps: Industrialising Model Delivery",
    body: ["A model that exists only in a notebook has zero business value. MLOps is the practice of applying DevOps principles to machine learning — continuous training, automated testing, reproducible experiments, and monitored production deployments.", "A minimal viable MLOps stack for an enterprise includes: an experiment tracking platform (MLflow, Weights & Biases), a feature store for consistent feature serving across training and inference, a model registry with versioning and approval workflows, and a monitoring layer that detects data drift and model degradation in production."]
  }, {
    heading: "A Practical Roadmap",
    body: ["Cloudyo recommends a three-phase approach for enterprises building AI-ready data infrastructure:"],
    bullets: ["Phase 1 — Foundation (0–6 months): Inventory existing data assets, establish a lakehouse landing zone, implement a data catalogue, define tagging and governance standards.", "Phase 2 — Enablement (6–12 months): Migrate priority data domains to lakehouse, deploy a feature store, launch an internal data marketplace, establish MLOps toolchain.", "Phase 3 — Scale (12–24 months): Expand to all data domains via mesh operating model, build RAG infrastructure for GenAI use cases, implement continuous monitoring and cost governance for ML workloads."]
  }]
}, {
  slug: "microsoft-new-commerce-experience",
  type: "blog",
  title: "Understanding Microsoft's New Commerce Experience",
  desc: "What the latest changes mean for your enterprise agreement.",
  date: "Sep 02, 2024",
  readTime: "7 min read",
  author: "Sarah Kim",
  authorRole: "Senior Licensing Advisor, Cloudyo",
  keyTakeaways: ["NCE locks most subscriptions into annual terms — monthly flexibility carries a 20% premium", "EA customers are not directly affected but face pressure to migrate to MCA", "Price protection during the term is a genuine benefit, but renewal uplift risk remains", "Proactive licence optimisation before renewal is more important than ever under NCE"],
  sections: [{
    heading: "What Is the New Commerce Experience?",
    body: ["Microsoft's New Commerce Experience (NCE) is a significant restructuring of how Microsoft 365, Azure, Dynamics 365, and Power Platform subscriptions are purchased through the Cloud Solution Provider (CSP) channel. Introduced in 2022 and progressively mandated, NCE changes term structures, cancellation policies, and pricing rules in ways that have significant commercial implications for enterprise customers.", "The core change is the introduction of committed annual or multi-year subscription terms, replacing the previous month-to-month flexibility that many organisations relied on. Under NCE, monthly subscriptions are available but carry a 20% price premium over the annual equivalent — a deliberate commercial nudge toward commitment."]
  }, {
    heading: "What Changed for CSP Customers",
    body: ["Under the legacy CSP model, resellers could provision and cancel Microsoft 365 licences on a monthly basis with minimal notice. This was popular with organisations managing seasonal workforce fluctuations or post-acquisition integrations. NCE removes this flexibility for standard commercial customers.", "Annual subscriptions under NCE can be cancelled within the first 72 hours of a term or billing anniversary. After that window, the customer is committed for the remainder of the annual term. Mid-term seat reductions are not permitted — though seat additions are allowed and billed pro-rata."]
  }, {
    heading: "Impact on Enterprise Agreement Customers",
    body: ["Enterprise Agreement (EA) customers are not directly subject to NCE rules — the EA is a separate commercial vehicle that still offers the familiar True-Up model and three-year term structure. However, Microsoft is actively promoting the Microsoft Customer Agreement (MCA) as the successor to the EA, and MCA subscriptions are governed by NCE terms.", "Organisations approaching EA renewal should carefully evaluate whether migrating to MCA makes sense for their situation. The MCA offers more granular billing and faster provisioning, but loses some of the price certainty and negotiation leverage available under a fully negotiated EA."]
  }, {
    heading: "The Seat Optimisation Imperative",
    body: ["One of the most common errors we see at clients is carrying excess Microsoft 365 licences that cannot be reduced mid-term. Under legacy CSP, surplus licences could be cancelled on 30 days' notice — a safety valve that no longer exists under NCE annual terms.", "Before your next renewal cycle, we recommend conducting a full utilisation review: active users vs assigned licences, feature usage across licence tiers, and opportunities to downgrade users from E5 to E3 or E1 where functionality usage does not justify the premium tier. For a 1,000-seat organisation, moving 200 users from E5 to E3 saves approximately $90,000 per year at list price."]
  }, {
    heading: "Negotiating Under NCE",
    body: ["Despite the standardisation of NCE, there remains meaningful room to negotiate — particularly for organisations purchasing at scale through an EA or a large CSP transaction. Cloudyo has secured price concessions of 15–25% below list on Microsoft 365 E3/E5 for clients with 500+ seats by combining volume leverage with competitive alternatives and Microsoft's own incentive programmes.", "The key is to approach renewal 90–120 days in advance, with a clean licence position analysis and a clear sense of your alternatives. Microsoft's commercial teams respond to preparation and competition — customers who arrive at renewal without either rarely achieve optimal outcomes."]
  }]
}, {
  slug: "retail-aws-migration",
  type: "case-study",
  title: "Retail: Zero-Downtime AWS Migration",
  desc: "Moving a legacy monolithic application to microservices on AWS.",
  date: "Aug 20, 2024",
  readTime: "7 min read",
  author: "Daniel Park",
  authorRole: "Cloud Migration Lead, Cloudyo",
  keyTakeaways: ["Zero minutes of customer-facing downtime across the full migration programme", "42% reduction in infrastructure costs post-migration", "Deployment frequency increased from monthly releases to multiple per day", "Migration completed 3 weeks ahead of schedule despite peak trading season"],
  sections: [{
    heading: "Client Background",
    body: ["Our client is a leading omnichannel retailer with 200+ stores across Southeast Asia and a rapidly growing e-commerce operation. Their core e-commerce platform had been running on a legacy Java monolith since 2011 — a system that had served them well in a simpler era but was now a serious constraint on growth.", "Peak trading events — including regional shopping festivals that drive 5–8× normal transaction volumes — were requiring the engineering team to provision dedicated hardware weeks in advance and run manual scaling playbooks during high-traffic periods. The system could not autoscale, and any deployment required a full overnight maintenance window."]
  }, {
    heading: "Why Zero Downtime Was Non-Negotiable",
    body: ["For a retailer of this scale, downtime is not merely an inconvenience — it is directly quantifiable. The client's finance team had calculated that a one-hour outage during a peak trading day costs approximately $1.2M in lost revenue and an additional $400K in customer service costs.", "The business had experienced two significant outages in the 18 months prior to the engagement, both linked to deployment failures. Leadership was unwilling to accept any migration approach that introduced additional downtime risk. This became the non-negotiable constraint around which our entire architecture and migration sequencing was designed."]
  }, {
    heading: "The Migration Approach",
    body: ["Cloudyo selected the Strangler Fig pattern as the primary migration strategy — incrementally extracting services from the monolith and routing traffic to new microservices via an API gateway, while the legacy system continued to serve requests in parallel. This approach eliminates the need for a cutover and allows individual services to be migrated, tested, and rolled back independently.", "The migration was sequenced by domain: product catalogue and search first (low write contention, high read traffic — ideal for demonstrating scale benefits), followed by cart and checkout, then order management, and finally authentication and customer profiles. Each domain extraction was preceded by a comprehensive contract testing phase to ensure API compatibility."]
  }, {
    heading: "AWS Architecture and Tooling",
    body: ["The target architecture was built on Amazon EKS for container orchestration, with Amazon RDS Aurora replacing the legacy MySQL cluster and Amazon DynamoDB handling session data and product catalogue lookups. AWS Application Load Balancer with weighted target group routing enabled gradual traffic shifting from monolith to microservices at the 1%, 10%, 25%, 50%, and 100% levels.", "AWS CodePipeline and CodeDeploy automated the CI/CD pipeline, reducing deployment time from 4 hours (legacy) to 12 minutes. CloudWatch dashboards and alarms provided real-time visibility into service health throughout the migration, with automated rollback triggers configured at key traffic thresholds."]
  }, {
    heading: "Results",
    body: ["The full migration programme was completed over 7 months — three weeks ahead of the original plan. Zero minutes of customer-facing downtime were recorded across the entire engagement, including during the client's annual mid-year sale event, which fell midway through the migration.", "Post-migration infrastructure costs fell by 42% versus the pre-migration on-premises and legacy cloud spend, driven by autoscaling efficiency, Reserved Instance coverage, and the elimination of over-provisioned capacity that had been maintained as a safety margin. Deployment frequency increased from one major release per month to an average of four per day."]
  }]
}, {
  slug: "state-of-software-asset-management",
  type: "whitepaper",
  title: "The State of Software Asset Management",
  desc: "Industry benchmark data on software utilisation and waste.",
  date: "Aug 05, 2024",
  readTime: "10 min read",
  author: "Priya Sharma",
  authorRole: "SAM Practice Lead, Cloudyo",
  keyTakeaways: ["Average enterprise wastes 34% of software licence spend on unused or underused assets", "Only 28% of organisations have a mature SAM programme in place", "Publisher audits are increasing in frequency — Oracle, Microsoft, and IBM lead in volume", "Cloud and SaaS proliferation has made traditional SAM approaches insufficient"],
  sections: [{
    heading: "About This Report",
    body: ["This report draws on Cloudyo's analysis of software estates across 140 enterprise engagements conducted between January 2023 and June 2024, spanning financial services, retail, manufacturing, and public sector organisations in Asia Pacific and EMEA.", "Collectively, these organisations manage over $4.2B in annual software spend. The patterns we observe across this dataset provide a uniquely detailed picture of how enterprises are managing — and mismanaging — their software assets in an increasingly complex licensing landscape."]
  }, {
    heading: "Key Finding: The Waste Problem",
    body: ["Across all engagements, the average organisation was wasting 34% of its software licence budget on assets that were either entirely unused, assigned to departed employees, or deployed at a higher tier than required for the actual usage pattern.", "This waste is not evenly distributed. The highest-waste categories are productivity suites (primarily Microsoft 365 and Google Workspace), where seat creep and over-provisioning of premium tiers are pervasive, and enterprise applications (ERP, CRM, ITSM), where named-user licences are routinely assigned without usage verification."]
  }, {
    heading: "SAM Maturity Distribution",
    body: ["We assessed SAM maturity across five dimensions: discovery coverage, entitlement management, usage monitoring, renewal governance, and audit readiness. Organisations were categorised across four maturity levels:"],
    bullets: ["Level 1 — Reactive (39% of respondents): No formal SAM programme. Licence data lives in spreadsheets. Audits are managed reactively and expensively.", "Level 2 — Aware (33% of respondents): Basic discovery tooling in place. Renewal calendar exists but renewal strategy is limited to renewing what was purchased previously.", "Level 3 — Managed (20% of respondents): Dedicated SAM capability, integrated tooling, regular compliance reviews, and proactive renewal management.", "Level 4 — Optimised (8% of respondents): SAM is embedded in IT governance. Continuous compliance posture, cloud and SaaS visibility, and commercial intelligence used in every vendor negotiation."]
  }, {
    heading: "The Audit Landscape",
    body: ["Software publisher audits increased by 23% year-on-year in the period covered by this report. Oracle remains the most aggressive auditor by volume, followed by Microsoft (particularly in the context of NCE transitions) and IBM. The average cost of a reactive audit response — including legal fees, compliance project costs, and settlement — was $2.1M for organisations with >1,000 employees.", "Organisations at SAM Maturity Level 3 and above experienced significantly lower audit exposure: 78% were able to demonstrate a clean licence position within 30 days of an audit notification, versus 12% at Level 1. The investment in proactive SAM pays for itself many times over in audit risk reduction alone."]
  }, {
    heading: "Cloud and SaaS: The New SAM Frontier",
    body: ["Traditional SAM programmes were designed for on-premises perpetual licences. The shift to cloud subscription and SaaS has fundamentally changed the SAM challenge — and exposed the limitations of legacy tooling and processes.", "SaaS applications are typically procured outside of central IT (shadow IT), creating an unmanaged sprawl of active subscriptions, redundant tools, and orphaned accounts. Cloudyo's data shows the average enterprise has 4.2× more active SaaS subscriptions than their IT department is aware of. A modern SAM programme must extend to SaaS discovery, contract consolidation, and usage-based optimisation."]
  }, {
    heading: "Recommendations",
    body: ["Based on our benchmark data, we recommend the following priority actions regardless of current SAM maturity:"],
    bullets: ["Conduct a full software estate discovery using automated tooling, not manual surveys. You cannot manage what you cannot see.", "Establish a renewal calendar with 90-day advance notice for all contracts above $50,000. Reactive renewals consistently result in worse commercial outcomes.", "Implement a leavers process that triggers licence reclamation within 48 hours of employee departure. Departed employee licences represent 11% of total waste in our dataset.", "Extend SAM coverage to SaaS by integrating an identity provider (Okta, Azure AD, Google Workspace) with a SaaS management platform to gain visibility into active applications and usage.", "Engage independent advisors before any major publisher audit. The cost of preparation is a fraction of the cost of an unprepared settlement."]
  }]
}];
function W4(t) {
  return Ml.find(i => i.slug === t);
}
const $4 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
const J4 = {
  blog: "bg-blue-50 text-blue-700",
  "case-study": "bg-amber-50 text-amber-700",
  whitepaper: "bg-emerald-50 text-emerald-700"
};
function e6() {
  const resourceCatalog = useResources(Ml);
  const t = i => {
    const s = i === "all" ? resourceCatalog : resourceCatalog.filter(r => r.type === i);
    return f.jsx("div", {
      className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8",
      children: s.map((r, l) => f.jsxs(Rh, {
        className: "flex flex-col overflow-hidden border-slate-200 hover:shadow-lg transition-shadow group",
        children: [f.jsx("div", {
          className: "h-48 bg-slate-100 relative",
          children: f.jsx("div", {
            className: `absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${J4[r.type]}`,
            children: r.type.replace("-", " ")
          })
        }), f.jsxs(Aw, {
          children: [f.jsx(Ew, {
            className: "text-xl text-primary leading-tight group-hover:text-accent transition-colors",
            children: r.title,
            role: "heading",
            "aria-level": 3
          }), f.jsx(jw, {
            className: "pt-2",
            children: r.desc
          })]
        }), f.jsxs(Cw, {
          className: "mt-auto pt-4 flex justify-between items-center text-sm",
          children: [f.jsx("span", {
            className: "text-slate-400",
            children: r.date
          }), f.jsxs(ve, {
            href: `/resources/${r.slug}`,
            className: "text-accent font-semibold hover:underline flex items-center gap-1",
            children: ["Read ", f.jsx(wn, {
              size: 14
            })]
          })]
        })]
      }, l))
    });
  };
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 text-center max-w-4xl",
        children: f.jsxs(je.div, {
          initial: "hidden",
          animate: "visible",
          variants: $4,
          children: [f.jsx("h1", {
            className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
            children: f.jsx(EditableCopy, {
              index: 0,
              fallback: "Resources & Insights"
            })
          }), f.jsx("p", {
            className: "text-xl text-slate-300 leading-relaxed mb-8",
            children: f.jsx(EditableCopy, {
              index: 1,
              fallback: "Expert perspectives, technical guides, and success stories to help you navigate the complex world of enterprise IT."
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs(Z4, {
          defaultValue: "all",
          className: "w-full",
          children: [f.jsx("div", {
            className: "flex justify-center mb-8",
            children: f.jsxs($w, {
              className: "bg-slate-100 p-1",
              children: [f.jsx(sr, {
                value: "all",
                className: "data-[state=active]:bg-white data-[state=active]:text-primary px-6",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "All"
                })
              }), f.jsx(sr, {
                value: "blog",
                className: "data-[state=active]:bg-white data-[state=active]:text-primary px-6",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "Blog"
                })
              }), f.jsx(sr, {
                value: "case-study",
                className: "data-[state=active]:bg-white data-[state=active]:text-primary px-6",
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Case Studies"
                })
              }), f.jsx(sr, {
                value: "whitepaper",
                className: "data-[state=active]:bg-white data-[state=active]:text-primary px-6",
                children: f.jsx(EditableCopy, {
                  index: 5,
                  fallback: "Whitepapers"
                })
              })]
            })
          }), f.jsx(rr, {
            value: "all",
            children: t("all")
          }), f.jsx(rr, {
            value: "blog",
            children: t("blog")
          }), f.jsx(rr, {
            value: "case-study",
            children: t("case-study")
          }), f.jsx(rr, {
            value: "whitepaper",
            children: t("whitepaper")
          })]
        })
      })
    })]
  });
}
const t6 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
const Bd = {
  blog: "Blog",
  "case-study": "Case Study",
  whitepaper: "Whitepaper"
};
const n6 = {
  blog: "bg-blue-100 text-blue-700",
  "case-study": "bg-amber-100 text-amber-700",
  whitepaper: "bg-emerald-100 text-emerald-700"
};
function i6() {
  const resourceCatalog = useResources(Ml);
  const t = $x(),
    i = useArticle(W4(t.slug));
  if (!i) return f.jsxs("div", {
    className: "w-full pt-40 pb-24 text-center",
    children: [f.jsx("h1", {
      className: "text-3xl font-bold text-primary mb-4",
      children: "Resource not found"
    }), f.jsx(ve, {
      href: "/resources",
      className: "text-accent underline",
      children: "Back to Resources"
    })]
  });
  const s = resourceCatalog.filter(r => r.slug !== i.slug && r.type === i.type).slice(0, 2);
  return f.jsxs("div", {
    className: "w-full bg-white",
    children: [f.jsx("section", {
      className: "pt-32 pb-16 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl",
        children: f.jsxs(je.div, {
          initial: "hidden",
          animate: "visible",
          variants: t6,
          children: [f.jsxs(ve, {
            href: "/resources",
            className: "inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm mb-8 group",
            children: [f.jsx(aA, {
              size: 16,
              className: "group-hover:-translate-x-1 transition-transform"
            }), "Back to Resources"]
          }), f.jsx("div", {
            className: `inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6 ${i.type === "blog" ? "bg-blue-400/20 text-blue-200" : i.type === "case-study" ? "bg-amber-400/20 text-amber-200" : "bg-emerald-400/20 text-emerald-200"}`,
            children: Bd[i.type]
          }), f.jsx("h1", {
            className: "text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight",
            children: i.title
          }), f.jsx("p", {
            className: "text-xl text-slate-300 mb-8",
            children: i.desc
          }), f.jsxs("div", {
            className: "flex flex-wrap items-center gap-6 text-slate-400 text-sm",
            children: [f.jsxs("span", {
              className: "flex items-center gap-2",
              children: [f.jsx($A, {
                size: 15
              }), " ", i.author, " — ", i.authorRole]
            }), f.jsxs("span", {
              className: "flex items-center gap-2",
              children: [f.jsx(mA, {
                size: 15
              }), " ", i.readTime]
            }), f.jsx("span", {
              children: i.date
            })]
          })]
        })
      })
    }), f.jsxs("div", {
      className: "container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-16",
      children: [f.jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-12",
        children: [f.jsx(je.div, {
          className: "lg:col-span-2",
          initial: {
            opacity: 0,
            y: 24
          },
          animate: {
            opacity: 1,
            y: 0
          },
          transition: {
            duration: .6,
            delay: .1
          },
          children: f.jsx(ArticleBody, {
            children: i.sections.map((r, l) => f.jsxs("div", {
              className: "mb-10",
              children: [r.heading && f.jsx("h2", {
                className: "text-2xl font-bold text-primary mb-4",
                children: r.heading
              }), r.body.map((d, u) => f.jsx("p", {
                className: "text-slate-600 leading-relaxed mb-4",
                children: d
              }, u)), r.bullets && f.jsx("ul", {
                className: "space-y-3 mt-4",
                children: r.bullets.map((d, u) => f.jsxs("li", {
                  className: "flex gap-3 text-slate-600",
                  children: [f.jsx("span", {
                    className: "mt-1 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0",
                    children: f.jsx(Fn, {
                      size: 13
                    })
                  }), f.jsx("span", {
                    children: d
                  })]
                }, u))
              })]
            }, l))
          })
        }), f.jsx(je.div, {
          className: "lg:col-span-1",
          initial: {
            opacity: 0,
            y: 24
          },
          animate: {
            opacity: 1,
            y: 0
          },
          transition: {
            duration: .6,
            delay: .2
          },
          children: f.jsxs("div", {
            className: "sticky top-28 space-y-8",
            children: [f.jsxs("div", {
              className: "bg-slate-50 rounded-2xl p-6 border border-slate-100",
              children: [f.jsx("h3", {
                className: "font-bold text-primary text-lg mb-4",
                children: "Key Takeaways"
              }), f.jsx("ul", {
                className: "space-y-3",
                children: i.keyTakeaways.map((r, l) => f.jsxs("li", {
                  className: "flex gap-3 text-slate-600 text-sm",
                  children: [f.jsx("span", {
                    className: "mt-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0",
                    children: f.jsx("span", {
                      className: "w-1.5 h-1.5 rounded-full bg-white"
                    })
                  }), r]
                }, l))
              })]
            }), f.jsxs("div", {
              className: "bg-primary rounded-2xl p-6 text-white",
              children: [f.jsx("h3", {
                className: "font-bold text-lg mb-3",
                children: "Talk to an Expert"
              }), f.jsx("p", {
                className: "text-slate-300 text-sm mb-5",
                children: "Ready to put these insights into action? Our advisors are here to help."
              }), f.jsx(qe, {
                asChild: !0,
                className: "w-full bg-accent hover:bg-accent/90 text-white rounded-lg",
                children: f.jsxs(ve, {
                  href: "/contact",
                  className: "flex items-center justify-center gap-2",
                  children: ["Get in Touch ", f.jsx(wn, {
                    size: 15
                  })]
                })
              })]
            })]
          })
        })]
      }), s.length > 0 && f.jsxs("div", {
        className: "mt-20 pt-12 border-t border-slate-100",
        children: [f.jsxs("h2", {
          className: "text-2xl font-bold text-primary mb-8",
          children: ["Related ", Bd[i.type], "s"]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 gap-8",
          children: s.map((r, l) => f.jsxs(ve, {
            href: `/resources/${r.slug}`,
            className: "group p-6 rounded-2xl border border-slate-200 hover:border-accent/40 hover:shadow-md transition-all block",
            children: [f.jsx("div", {
              className: `inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mb-3 ${n6[r.type]}`,
              children: Bd[r.type]
            }), f.jsx("h3", {
              className: "font-bold text-primary text-lg leading-snug mb-2 group-hover:text-accent transition-colors",
              children: r.title
            }), f.jsx("p", {
              className: "text-slate-500 text-sm mb-4",
              children: r.desc
            }), f.jsxs("span", {
              className: "text-accent font-semibold text-sm flex items-center gap-1",
              children: ["Read ", f.jsx(wn, {
                size: 13
              })]
            })]
          }, l))
        })]
      })]
    })]
  });
}
const a6 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function s6() {
  const t = [{
    title: "Client First",
    desc: "We sit on your side of the table, offering vendor-agnostic advice that prioritizes your business outcomes.",
    icon: f.jsx(ZA, {
      size: 24
    })
  }, {
    title: "Deep Expertise",
    desc: "We hire the best. Our team consists of former vendor auditors, certified architects, and financial analysts.",
    icon: f.jsx(KA, {
      size: 24
    })
  }, {
    title: "Global Reach",
    desc: "Enterprise IT knows no borders. We deliver consistent, high-quality advisory services across 30+ countries.",
    icon: f.jsx(SA, {
      size: 24
    })
  }, {
    title: "Measurable Impact",
    desc: "We don't just write reports. We execute strategies that deliver concrete financial and operational results.",
    icon: f.jsx(a0, {
      size: 24
    })
  }];
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsx("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: a6,
            className: "max-w-3xl",
            children: [f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "About Cloudyo"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "We are building the world's most trusted advisory firm for enterprise technology lifecycle management."
              })
            })]
          })
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
          children: [f.jsxs("div", {
            children: [f.jsx("h2", {
              className: "text-3xl font-bold text-primary mb-6",
              children: f.jsx(EditableCopy, {
                index: 2,
                fallback: "Our Story"
              })
            }), f.jsxs("div", {
              className: "space-y-6 text-slate-600 text-lg",
              children: [f.jsx("p", {
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "Cloudyo was founded in 2025 with a simple observation: the complexity of enterprise software licensing and cloud architecture was outpacing the ability of organizations to manage it effectively."
                })
              }), f.jsx("p", {
                children: f.jsx(EditableCopy, {
                  index: 4,
                  fallback: "Vendors were building increasingly convoluted pricing models, and cloud bills were spiraling out of control. Enterprises needed an advocate\u2014a partner who understood the technical reality and the commercial levers."
                })
              }), f.jsx("p", {
                children: f.jsx(EditableCopy, {
                  index: 5,
                  fallback: "Today, we manage multi-million dollar software portfolios for our clients, helping them navigate complex digital transformations, secure better commercial terms, and build infrastructure that scales."
                })
              })]
            })]
          }), f.jsx("div", {
            className: "relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100",
            children: f.jsx("img", {
              src: "/about-team.png",
              alt: "Cloudyo team collaborating",
              className: "w-full h-full object-cover"
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "text-center max-w-3xl mx-auto mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Our Values"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 7,
              fallback: "The principles that guide how we work with our clients and each other."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8",
          children: t.map((i, s) => f.jsxs("div", {
            className: "bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow",
            children: [f.jsx("div", {
              className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: i.icon
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-3",
              children: i.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: i.desc
            })]
          }, s))
        })]
      })
    })]
  });
}
const r6 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function o6() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 text-center max-w-4xl",
        children: f.jsxs(je.div, {
          initial: "hidden",
          animate: "visible",
          variants: r6,
          children: [f.jsx("h1", {
            className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
            children: f.jsx(EditableCopy, {
              index: 0,
              fallback: "Contact Us"
            })
          }), f.jsx("p", {
            className: "text-xl text-slate-300 leading-relaxed mb-8",
            children: f.jsx(EditableCopy, {
              index: 1,
              fallback: "Get in touch with our team of cloud architects, procurement specialists, and FinOps practitioners."
            })
          })]
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-slate-50",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto",
          children: [f.jsxs("div", {
            className: "bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100",
            children: [f.jsx("h2", {
              className: "text-2xl font-bold text-primary mb-6",
              children: f.jsx(EditableCopy, {
                index: 2,
                fallback: "Send us a message"
              })
            }), f.jsx(BusinessForm, {
              kind: "contact"
            })]
          }), f.jsxs("div", {
            children: [f.jsxs("div", {
              className: "mb-12",
              children: [f.jsx("h2", {
                className: "text-2xl font-bold text-primary mb-6",
                children: f.jsx(EditableCopy, {
                  index: 3,
                  fallback: "Our Office"
                })
              }), f.jsxs("div", {
                className: "flex gap-4",
                children: [f.jsx("div", {
                  className: "mt-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0",
                  children: f.jsx(VA, {
                    size: 20
                  })
                }), f.jsxs("div", {
                  children: [f.jsx("h3", {
                    className: "font-bold text-primary text-lg mb-1",
                    children: f.jsx(EditableCopy, {
                      index: 4,
                      fallback: "Hong Kong"
                    })
                  }), f.jsxs("p", {
                    className: "text-slate-600",
                    children: ["Unit 2610, Apec Plaza", f.jsx("br", {}), "49 Hoi Yuen Rd", f.jsx("br", {}), "Kwun Tong, Hong Kong"]
                  })]
                })]
              })]
            }), f.jsxs("div", {
              children: [f.jsx("h2", {
                className: "text-2xl font-bold text-primary mb-6",
                children: f.jsx(EditableCopy, {
                  index: 5,
                  fallback: "Direct Contact"
                })
              }), f.jsxs("div", {
                className: "space-y-6",
                children: [f.jsxs("div", {
                  className: "flex items-center gap-4",
                  children: [f.jsx("div", {
                    className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0",
                    children: f.jsx(BA, {
                      size: 20
                    })
                  }), f.jsx("p", {
                    className: "text-slate-600 text-lg",
                    children: f.jsx(EditableCopy, {
                      index: 6,
                      fallback: "+852 3265 5432"
                    })
                  })]
                }), f.jsxs("div", {
                  className: "flex items-center gap-4",
                  children: [f.jsx("div", {
                    className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0",
                    children: f.jsx(_A, {
                      size: 20
                    })
                  }), f.jsx("p", {
                    className: "text-slate-600 text-lg",
                    children: f.jsx(EditableCopy, {
                      index: 7,
                      fallback: "support@cloudyo.ai"
                    })
                  })]
                })]
              })]
            })]
          })]
        })
      })
    })]
  });
}
const l6 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function c6() {
  return f.jsxs("div", {
    className: "w-full",
    children: [f.jsx("section", {
      className: "pt-32 pb-20 bg-primary text-white",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: f.jsx("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          children: f.jsxs(je.div, {
            initial: "hidden",
            animate: "visible",
            variants: l6,
            className: "max-w-3xl",
            children: [f.jsx("h1", {
              className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6",
              children: f.jsx(EditableCopy, {
                index: 0,
                fallback: "Partner With Us"
              })
            }), f.jsx("p", {
              className: "text-xl text-slate-300 leading-relaxed mb-8",
              children: f.jsx(EditableCopy, {
                index: 1,
                fallback: "Join the Cloudyo ecosystem. We build mutually beneficial relationships with technology providers, system integrators, and specialized consultancies."
              })
            }), f.jsx(qe, {
              size: "lg",
              className: "bg-accent hover:bg-accent/90 text-white rounded-full px-8",
              asChild: !0,
              children: f.jsx(ve, {
                href: "#apply",
                children: f.jsx(EditableCopy, {
                  index: 2,
                  fallback: "Apply to Partner"
                })
              })
            })]
          })
        })
      })
    }), f.jsx("section", {
      className: "py-24 bg-white",
      children: f.jsxs("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8",
        children: [f.jsxs("div", {
          className: "text-center max-w-3xl mx-auto mb-16",
          children: [f.jsx("h2", {
            className: "text-3xl font-bold text-primary mb-6",
            children: f.jsx(EditableCopy, {
              index: 3,
              fallback: "Why Partner With Cloudyo?"
            })
          }), f.jsx("p", {
            className: "text-lg text-slate-600",
            children: f.jsx(EditableCopy, {
              index: 4,
              fallback: "We amplify your reach and complement your capabilities. Our partners gain access to our global enterprise customer base and deep technical bench."
            })
          })]
        }), f.jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-8",
          children: [{
            icon: f.jsx(jA, {
              size: 32
            }),
            title: "Co-Selling Opportunities",
            desc: "Access collaborative go-to-market motions and deal registration benefits."
          }, {
            icon: f.jsx(zl, {
              size: 32
            }),
            title: "Technical Enablement",
            desc: "Gain access to our architectural blueprints, FinOps frameworks, and engineering resources."
          }, {
            icon: f.jsx(a0, {
              size: 32
            }),
            title: "Market Expansion",
            desc: "Leverage our geographic footprint and enterprise relationships to enter new markets."
          }].map((u, m) => f.jsxs("div", {
            className: "p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center flex flex-col items-center",
            children: [f.jsx("div", {
              className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6",
              children: u.icon
            }), f.jsx("h3", {
              className: "text-xl font-bold text-primary mb-3",
              children: u.title
            }), f.jsx("p", {
              className: "text-slate-600",
              children: u.desc
            })]
          }, m))
        })]
      })
    }), f.jsx("section", {
      id: "apply",
      className: "py-24 bg-slate-50",
      children: f.jsx("div", {
        className: "container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl",
        children: f.jsxs("div", {
          className: "bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100",
          children: [f.jsx("h2", {
            className: "text-3xl font-bold text-primary mb-2 text-center",
            children: f.jsx(EditableCopy, {
              index: 5,
              fallback: "Partner Application"
            })
          }), f.jsx("p", {
            className: "text-slate-600 text-center mb-8",
            children: f.jsx(EditableCopy, {
              index: 6,
              fallback: "Tell us about your organization and how we might collaborate."
            })
          }), f.jsx(BusinessForm, {
            kind: "partner"
          })]
        })
      })
    })]
  });
}
const u6 = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: .6
    }
  }
};
function d6() {
  return f.jsx("div", {
    className: "w-full bg-white text-slate-800 pt-32 pb-24",
    children: f.jsx("div", {
      className: "container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl",
      children: f.jsxs(je.div, {
        initial: "hidden",
        animate: "visible",
        variants: u6,
        children: [f.jsx("h1", {
          className: "text-4xl md:text-5xl font-bold text-primary mb-6",
          children: f.jsx(EditableCopy, {
            index: 0,
            fallback: "Privacy Policy"
          })
        }), f.jsx("p", {
          className: "text-lg text-slate-500 mb-12",
          children: f.jsx(EditableCopy, {
            index: 1,
            fallback: "Last updated: October 15, 2024"
          })
        }), f.jsxs("div", {
          className: "prose prose-slate max-w-none prose-headings:text-primary prose-a:text-accent",
          children: [f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 2,
              fallback: "Cloudyo Inc. (\"Cloudyo\", \"we\", \"us\", or \"our\") respects your privacy and is committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you."
            })
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 3,
              fallback: "1. Information We Collect"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 4,
              fallback: "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:"
            })
          }), f.jsxs("ul", {
            children: [f.jsxs("li", {
              children: [f.jsx("strong", {
                children: f.jsx(EditableCopy, {
                  index: 5,
                  fallback: "Identity Data"
                })
              }), " includes first name, last name, username or similar identifier, title."]
            }), f.jsxs("li", {
              children: [f.jsx("strong", {
                children: f.jsx(EditableCopy, {
                  index: 6,
                  fallback: "Contact Data"
                })
              }), " includes billing address, delivery address, email address and telephone numbers."]
            }), f.jsxs("li", {
              children: [f.jsx("strong", {
                children: f.jsx(EditableCopy, {
                  index: 7,
                  fallback: "Technical Data"
                })
              }), " includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website."]
            }), f.jsxs("li", {
              children: [f.jsx("strong", {
                children: f.jsx(EditableCopy, {
                  index: 8,
                  fallback: "Usage Data"
                })
              }), " includes information about how you use our website, products and services."]
            })]
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 9,
              fallback: "2. How We Use Information"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 10,
              fallback: "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:"
            })
          }), f.jsxs("ul", {
            children: [f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 11,
                fallback: "Where we need to perform the contract we are about to enter into or have entered into with you."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 12,
                fallback: "Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 13,
                fallback: "Where we need to comply with a legal obligation."
              })
            })]
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 14,
              fallback: "3. Data Sharing"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 15,
              fallback: "We may share your personal data with the parties set out below for the purposes set out in the table above:"
            })
          }), f.jsxs("ul", {
            children: [f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 16,
                fallback: "Internal Third Parties."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 17,
                fallback: "External Third Parties such as service providers acting as processors based who provide IT and system administration services."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 18,
                fallback: "Third parties to whom we may choose to sell, transfer or merge parts of our business or our assets."
              })
            })]
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 19,
              fallback: "4. Cookies"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 20,
              fallback: "You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly."
            })
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 21,
              fallback: "5. Security"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 22,
              fallback: "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know."
            })
          }), f.jsx("h2", {
            children: f.jsx(EditableCopy, {
              index: 23,
              fallback: "6. Your Rights"
            })
          }), f.jsx("p", {
            children: f.jsx(EditableCopy, {
              index: 24,
              fallback: "Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:"
            })
          }), f.jsxs("ul", {
            children: [f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 25,
                fallback: "Request access to your personal data."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 26,
                fallback: "Request correction of your personal data."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 27,
                fallback: "Request erasure of your personal data."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 28,
                fallback: "Object to processing of your personal data."
              })
            }), f.jsx("li", {
              children: f.jsx(EditableCopy, {
                index: 29,
                fallback: "Request restriction of processing your personal data."
              })
            })]
          })]
        })]
      })
    })
  });
}
export { QM as Header, QR as Footer, x4 as Home, w4 as Expertise, T4 as Procurement, E4 as FinOps, N4 as Cloud, M4 as AI, O4 as Industries, z4 as Providers, e6 as Resources, i6 as Article, s6 as About, o6 as Contact, c6 as Partner, d6 as Privacy };
