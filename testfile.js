// main code of EmTool - ClockConfigure
// the sole global variable denoted by capital letters
var NUTOOL_CLOCK = {};

(function () {
    // all the global variables within the immediately-invoked function scope
    const g_VERSION_CODE = 'V2.00.009';
    var g_NUC_TreeView_Width = 250,
        g_NUC_TreeView_Height,
        g_Dialog_Width,
        g_Dialog_Height,
        g_chipTypes = ["APM32E103xCxE", "M030G", "M031", "M051", "M0518", "M0519", "M0564", "M2003C", "M2351", "M251", "M261", "M451", "M460", "M480", "MINI51", "NANO100", "NM1200", "NM1500", "NUC029", "NUC100", "NUC200", "NUC400", "NUC505"],
        g_chipType = "",
        g_selectedPartNoValue = "",
        g_partNumber_package = "",
        g_bLessThanOrEqualIE8,
        g_utility = {
            getContext: null,
            removeContext: null,
            addEvent: null,
            triggerEvent: null
        },
        g_clockRegs = [], // to stash the real-time clock registers
        g_saved_clockRegs = [], // used to judge whether to invoke the dialog of warningForSaving.
        g_saved_current_clockRegs = [], // used to judge if the multi-way configure happens.
        g_clockRegisterNames = [],
        g_finalStep = 1, // start from 1.
        g_zoomScale = 1,
        g_maxClockRegsStringLength = 0,
        g_realLIRCoutputClock = 0,
        g_realHIRCoutputClock = 0,
        g_realHIRC2outputClock = 0,
        g_realHIRC48outputClock = 0,
        g_realMIRCoutputClock = 0,
        g_realMIRC1P2MoutputClock = 0,
        g_realRTC32koutputClock = 0,
        g_realLXToutputClock = 0,
        g_realHXToutputClock = 0,
        g_realPLLoutputClock = 0,
        g_realPLL2outputClock = 0,
        g_realPLL480MoutputClock = 0,
        g_realAPLLoutputClock = 0,
        g_realPLLFNoutputClock = 0,
        g_realHSUSBOTGPHYoutputClock = 0,
        g_realHCLKoutputClock = 0,
        g_realPCLKoutputClock = 0,
        g_realPCLK0outputClock = 0,
        g_realPCLK1outputClock = 0,
        g_realPCLK2outputClock = 0,
        g_saved_currentLIRCoutputClock = 0,
        g_saved_currentHIRCoutputClock = 0,
        g_saved_currentHIRC2outputClock = 0,
        g_saved_currentHIRC48outputClock = 0,
        g_saved_currentMIRCoutputClock = 0,
        g_saved_currentMIRC1P2MoutputClock = 0,
        g_saved_currentLXToutputClock = 0,
        g_saved_currentHXToutputClock = 0,
        g_saved_currentPLLoutputClock = 0,
        g_saved_currentPLL2outputClock = 0,
        g_saved_currentAPLLoutputClock = 0,
        g_saved_currentPLLFNoutputClock = 0,
        g_saved_currentHCLKoutputClock = 0,
        g_saved_currentPCLKoutputClock = 0,
        g_saved_currentPCLK0outputClock = 0,
        g_saved_currentPCLK1outputClock = 0,
        g_saved_currentPCLK2outputClock = 0,
        g_enabledBaseClocks = [],
        g_recordedCheckedNode = "",
        g_tooptipContent = "",       // for functional test
        g_generateCodeContent = "",  // for functional test
        g_clickIndexByTest = -1,     // for functional test
        g_svgGroup = null,
        g_clickedElementId,
        g_dividerInputValue,
        g_clockRegsString,
        g_clockRegsString1,
        g_clockRegsString2,
        g_briefName = "NuMicro",
        g_copyrightCompanyName = " Embeetle IDE",
        g_readConfigFile,
        g_userSelectUIlanguage,
        g_unPrintedCharacters,
        g_bReadyForRelease = true,
        g_bPressEnter = false,
        g_bAvoidClicking = false,
        g_bInvokedByCDHtmlDialog = true,
        g_bIsTriggerMultiConfiguring = false,
        g_clockRegTreesLoaded = true,
        g_bNotInvokeUpdateClockRegsTree = false,
        g_bSkipShowWarningForTriggerMultiWayConfigure = false,
        g_bSwitchD3ClockTree = false,
        g_bHasBSPtoSupport = true,
        g_bHXTorLXT = false,
        g_deviceConnected = false,
        g_connectedDevicePID,
        g_completePIDList = [],
        g_worker,
        g_concatenate_generated_code_begin,
        g_concatenate_generated_code_internal,
        g_concatenate_generated_code_end;

    // after the browser has downloaded all the data, it will run the window.onload function.
    window.onload = function () {
        loadClockConfigureTool();
        initPythonAppRelatedSettings();
        initListeners();
        changeUIlanguage();
        parsingPartNumID();
        if (window.Worker) {
            g_worker = new Worker('./worker/webusb.worker-bundle.js');
            setWorkerListener();
        }
        $('#versionCode').text(g_VERSION_CODE); // 設定版本號
    };

    function createD3ClockTree(inputModule) {
        var i,
            max,
            j,
            maxJ,
            k,
            maxK,
            $tabs = $("#tabs"),
            treeData = {},
            rootChildren = [], // these will be located at the 2nd level.
            CPUCLKChildren = [], // children arrays must coincide with rootChildren.
            LIRCChildren = [],
            HIRCChildren = [],
            HIRC2Children = [],
            HIRC48Children = [],
            MIRCChildren = [],
            MIRC1P2MChildren = [],
            RTC32kChildren = [],
            LXTChildren = [],
            HXTChildren = [],
            PLLChildren = [],
            PLL2Children = [],
            PLL480MChildren = [],
            APLLChildren = [],
            PLLFNChildren = [],
            HSUSBOTGPHYChildren = [],
            HCLKChildren = [],
            PCLKChildren = [],
            PCLK0Children = [],
            PCLK1Children = [],
            PCLK2Children = [],
            enabledModules = [], // enabledModules and enabledModuleFrequencies should be modified together.
            enabledModuleFrequencies = [],
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module),
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            sPWRCON = 'PWRCON'.toEquivalent().toString(),
            sHCLK_S = 'HCLK_S'.toEquivalent().toString(),
            sSTCLK_S = 'STCLK_S'.toEquivalent().toString(),
            sCLKO = 'CLKO'.toEquivalent().toString(),
            sCLKO_Divider = 'CLKO_Divider'.toEquivalent().toString(),
            sCLKO1 = 'CLKO1'.toEquivalent().toString(),
            sCLKO1_Divider = 'CLKO1_Divider'.toEquivalent().toString(),
            sSYST_CSR = 'SYST_CSR'.toEquivalent().toString(),
            s_S = '_S'.toEquivalent().toString(),
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            mask,
            selectField,
            selectFieldArray,
            selectFieldNameExtended,
            selectFieldNameExtendedShiftBit,
            oldSelectorOrDividerValue,
            newSelectorOrDividerValue,
            newSelectorOrDividerValue1,
            newSelectorOrDividerValue2,
            moduleName,
            fullFieldName,
            bChecked,
            enableField,
            enableFieldArray,
            whileCount,
            pushRelationshipChildren,
            populateD3Tree,
            nodeDblclickHandler,
            check_d3node,
            uncheck_d3node,
            domNode,
            updateSameSelectorOrDividerModules,
            totalNodes,
            maxLabelLength,
            selectedNode,
            draggingNode,
            duration,
            root,
            nodes,
            bDblClikedOnNode = false,
            bDragStarted,
            dragOngoing,
            viewerWidth,
            viewerHeight,
            tree,
            diagonal,
            zoomListener,
            basedragListener,
            baseSvg,
            tip,
            dragListener,
            overCircle,
            outCircle,
            updateTempConnector;

        // D3 Tree's json format:
        //{
        //  "name": "root",
        //  "children": [{
        //      "name": "LIRC",
        //      "children": [{
        //          "name": "WDT"
        //      }, {
        //          "name": "LXT",
        //      }, {
        //          "name": "PLL2"
        //      }]
        //  }]
        //};

        pushRelationshipChildren = function (whichChildren, moduleName) {
            whichChildren = whichChildren.slicePriorToX('/').toString();

            if (whichChildren === 'CPUCLK') {
                CPUCLKChildren.push(moduleName);
            } else if (whichChildren === sLIRC) {
                LIRCChildren.push(moduleName);
            } else if (whichChildren === 'HIRC48') {
                HIRC48Children.push(moduleName);
            } else if (whichChildren === sHIRC) {
                HIRCChildren.push(moduleName);
            } else if (whichChildren === sHIRC2) {
                HIRC2Children.push(moduleName);
            } else if (whichChildren === 'MIRC') {
                MIRCChildren.push(moduleName);
            } else if (whichChildren === 'MIRC1P2M') {
                MIRC1P2MChildren.push(moduleName);
            } else if (whichChildren === 'RTC32k') {
                RTC32kChildren.push(moduleName);
            } else if (whichChildren === sLXT) {
                LXTChildren.push(moduleName);
            } else if (whichChildren === sHXT) {
                HXTChildren.push(moduleName);
            } else if (whichChildren === sPLL) {
                PLLChildren.push(moduleName);
            } else if (whichChildren === 'PLL2') {
                PLL2Children.push(moduleName);
            } else if (whichChildren === 'PLL480M') {
                PLL480MChildren.push(moduleName);
            } else if (whichChildren === 'APLL') {
                APLLChildren.push(moduleName);
            } else if (whichChildren === 'PLLFN') {
                PLLFNChildren.push(moduleName);
            } else if (whichChildren === 'HSUSB_OTG_PHY') {
                HSUSBOTGPHYChildren.push(moduleName);
            } else if (whichChildren === sHCLK) {
                HCLKChildren.push(moduleName);
            } else if (whichChildren === sPCLK) {
                PCLKChildren.push(moduleName);
            } else if (whichChildren === 'PCLK0') {
                PCLK0Children.push(moduleName);
            } else if (whichChildren === 'PCLK1') {
                PCLK1Children.push(moduleName);
            } else if (whichChildren === 'PCLK2') {
                PCLK2Children.push(moduleName);
            }
            else {
                if (!g_bReadyForRelease && window.console) { window.console.log("ERROR! In pushRelationshipChildren, An error happened. Cannot find mother: " + whichChildren); }
            }
        };

        populateD3Tree = function (targetNodes) {
            var ii,
                imax,
                iindex,
                localJsonData = {},
                localArray = [],
                returnArray = [];

            for (ii = 0, imax = targetNodes.length; ii < imax; ii += 1) {
                localJsonData = {};
                localJsonData.name = targetNodes[ii];

                iindex = $.inArray(localJsonData.name, enabledModules);
                if (iindex !== -1) {
                    localJsonData.enabled = 1;
                    localJsonData.freq = enabledModuleFrequencies[iindex];
                }
                else {
                    localJsonData.enabled = 0;
                    localJsonData.freq = -1;
                }

                if (localJsonData.name === 'CPUCLK') {
                    localArray = CPUCLKChildren;
                }
                else if (localJsonData.name === sLIRC) {
                    localArray = LIRCChildren;
                } else if (localJsonData.name === 'HIRC48') {
                    localArray = HIRC48Children;
                } else if (localJsonData.name === sHIRC) {
                    localArray = HIRCChildren;
                } else if (localJsonData.name === sHIRC2) {
                    localArray = HIRC2Children;
                } else if (localJsonData.name === 'MIRC') {
                    localArray = MIRCChildren;
                } else if (localJsonData.name === 'MIRC1P2M') {
                    localArray = MIRC1P2MChildren;
                } else if (localJsonData.name === 'RTC32k') {
                    localArray = RTC32kChildren;
                } else if (localJsonData.name === sLXT) {
                    localArray = LXTChildren;
                } else if (localJsonData.name === sHXT) {
                    localArray = HXTChildren;
                } else if (localJsonData.name === sPLL) {
                    localArray = PLLChildren;
                } else if (localJsonData.name === 'PLL2') {
                    localArray = PLL2Children;
                } else if (localJsonData.name === 'PLL480M') {
                    localArray = PLL480MChildren;
                } else if (localJsonData.name === 'APLL') {
                    localArray = APLLChildren;
                } else if (localJsonData.name === 'PLLFN') {
                    localArray = PLLFNChildren;
                } else if (localJsonData.name === 'HSUSB_OTG_PHY') {
                    localArray = HSUSBOTGPHYChildren;
                } else if (localJsonData.name === sHCLK) {
                    localArray = HCLKChildren;
                } else if (localJsonData.name === sPCLK) {
                    localArray = PCLKChildren;
                } else if (localJsonData.name === 'PCLK0') {
                    localArray = PCLK0Children;
                } else if (localJsonData.name === 'PCLK1') {
                    localArray = PCLK1Children;
                } else if (localJsonData.name === 'PCLK2') {
                    localArray = PCLK2Children;
                }
                else {
                    localArray = {};
                }

                if (localArray.length > 0) {
                    localJsonData.children = populateD3Tree(localArray);
                }
                if ((g_bSwitchD3ClockTree && localJsonData.enabled) || !g_bSwitchD3ClockTree) {
                    returnArray.push(localJsonData);
                }
            }

            return returnArray;
        };

        nodeDblclickHandler = function (currentNode, enabled) {
            if (enabled) {
                uncheck_d3node(currentNode);
            }
            else {
                check_d3node(currentNode, true);
            }
        };

        check_d3node = function (currentNodeName, bCreateCanvas) {
            var checkingNode,
                bReturn = true;

            if (!g_bReadyForRelease && window.console) { window.console.log("In check_d3node, currentNodeName:" + currentNodeName + " / bCreateCanvas:" + bCreateCanvas); }
            if (typeof bCreateCanvas === 'undefined') {
                bCreateCanvas = false;
            }

            // before checking the node, we need to verify whether it can be enabled or not.
            d3.selectAll('g.node').each(function (d) {
                if (d.name === currentNodeName) {
                    checkingNode = d;
                }
            });

            if (!checkNodeBeAllowedToEnable(checkingNode)) {
                bReturn = false;

                return bReturn;
            }

            if (typeof NUTOOL_CLOCK.g_Module[currentNodeName] !== 'undefined') {
                // we can check only one of CLKO, CLKO_Divider and CLKO_1Hz at the same time
                if (currentNodeName === sCLKO) {
                    uncheck_d3node(sCLKO_Divider);
                    uncheck_d3node('CLKO_1Hz');
                }
                else if (currentNodeName === sCLKO_Divider) {
                    uncheck_d3node(sCLKO);
                    uncheck_d3node('CLKO_1Hz');
                }
                if (currentNodeName === sCLKO1) {
                    uncheck_d3node(sCLKO1_Divider);
                    //uncheck_d3node('CLKO_1Hz');
                }
                else if (currentNodeName === sCLKO1_Divider) {
                    uncheck_d3node(sCLKO1);
                    //uncheck_d3node('CLKO_1Hz');
                }
                else if (currentNodeName == 'CLKO_1Hz') {
                    uncheck_d3node(sCLKO);
                    uncheck_d3node(sCLKO_Divider);
                }

                if (!bCreateCanvas) {
                    createModuleOnly('tab-4', currentNodeName, '', '');
                }
                else {
                    if ($('#' + g_recordedCheckedNode + '_div')[0]) {
                        $('#' + g_recordedCheckedNode + '_div').hide();
                        $('#' + g_recordedCheckedNode + '_canvas').hide();
                        $('#' + g_recordedCheckedNode + '_div_protection').hide();
                        $('#' + g_recordedCheckedNode + '_div_showRealFreq').hide();
                    }

                    if (currentNodeName === sCLKO || currentNodeName === sCLKO_Divider ||
                        currentNodeName === sCLKO1 || currentNodeName === sCLKO1_Divider) {
                        createCLKOCanvas('tab-4', currentNodeName, '', '', NUTOOL_CLOCK.g_Module[currentNodeName][2]);
                    }
                    else {
                        createModuleCanvas('tab-4', currentNodeName, '', '', NUTOOL_CLOCK.g_Module[currentNodeName][2]);
                    }

                    g_recordedCheckedNode = currentNodeName;
                }

                // update enable field
                enableField = NUTOOL_CLOCK.g_Module[currentNodeName][1];
                enableFieldArray = [];
                whileCount = 0;
                if (enableField.indexOf('/') === -1) {
                    enableFieldArray.push(enableField);
                }
                else {
                    while (enableField.indexOf('/') !== -1) {
                        enableFieldArray.push(enableField.slicePriorToX('/'));
                        enableField = enableField.sliceAfterX('/');

                        whileCount = whileCount + 1;
                        if (whileCount > 10) {
                            break;
                        }
                    }

                    enableFieldArray.push(enableField);
                }
                for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                    writeNewValueToClockRegs(enableFieldArray[j], 1, '', g_bNotInvokeUpdateClockRegsTree);
                }

                // record the checked module
                enabledModules.push(currentNodeName);
                enabledModuleFrequencies.push($("#" + currentNodeName + "_span_showRealFreq").text());

                // update node information
                d3.selectAll('g.node').each(function (d) {
                    if (d.name === currentNodeName) {
                        d.enabled = 1;
                        d.freq = $("#" + currentNodeName + "_span_showRealFreq").text();
                    }
                });

                // chain effect
                if (currentNodeName === 'WWDT') {
                    // WDT should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.WDT !== 'undefined' && $.inArray('WDT', enabledModules) === -1) {
                        if (!check_d3node('WDT')) {
                            uncheck_d3node('WWDT');
                        }
                    }
                }
                else if (currentNodeName === 'WDT') {
                    // WWDT should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.WWDT !== 'undefined' && $.inArray('WWDT', enabledModules) === -1) {
                        if (!check_d3node('WWDT')) {
                            uncheck_d3node('WDT');
                        }
                    }
                }
                if (currentNodeName === 'EWWDT') {
                    // EWDT should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.EWDT !== 'undefined' && $.inArray('EWDT', enabledModules) === -1) {
                        if (!check_d3node('EWDT')) {
                            uncheck_d3node('EWWDT');
                        }
                    }
                }
                else if (currentNodeName === 'EWDT') {
                    // EWWDT should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.EWWDT !== 'undefined' && $.inArray('EWWDT', enabledModules) === -1) {
                        if (!check_d3node('EWWDT')) {
                            uncheck_d3node('EWDT');
                        }
                    }
                }
                else if (currentNodeName === 'CLKO_1Hz') { // for M451, M460, M480, M0564, NUC126 and NUC200AE
                    // RTC should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.RTC !== 'undefined' && $.inArray('RTC', enabledModules) === -1) {
                        if (!check_d3node('RTC')) {
                            uncheck_d3node('CLKO_1Hz');
                        }
                    }
                }
                else if (currentNodeName === 'USBH') {
                    // HSUSBH should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.HSUSBH !== 'undefined' && $.inArray('HSUSBH', enabledModules) === -1) {
                        if (!check_d3node('HSUSBH')) {
                            uncheck_d3node('USBH');
                        }
                    }
                }
                else if (currentNodeName === 'HSUSBH') {
                    // USBH should be enabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.USBH !== 'undefined' && $.inArray('USBH', enabledModules) === -1) {
                        if (!check_d3node('USBH')) {
                            uncheck_d3node('HSUSBH');
                        }
                    }
                }
            }

            return bReturn;
        };

        uncheck_d3node = function (currentNodeName, chainEffectException) {
            var index;

            chainEffectException = (typeof chainEffectException !== 'undefined') ? chainEffectException : [];

            if (!g_bReadyForRelease && window.console) { window.console.log("In uncheck_d3node, currentNodeName:" + currentNodeName); }
            if (typeof NUTOOL_CLOCK.g_Module[currentNodeName] !== 'undefined') {
                $('#' + currentNodeName + '_div').remove();
                $('#' + currentNodeName + '_canvas').remove();
                $('#' + currentNodeName + '_div_protection').remove();
                $('#' + currentNodeName + '_div_showRealFreq').remove();
                // update enable field
                enableField = NUTOOL_CLOCK.g_Module[currentNodeName][1];
                enableFieldArray = [];
                whileCount = 0;
                if (enableField.indexOf('/') === -1) {
                    enableFieldArray.push(enableField);
                }
                else {
                    while (enableField.indexOf('/') !== -1) {
                        enableFieldArray.push(enableField.slicePriorToX('/'));
                        enableField = enableField.sliceAfterX('/');

                        whileCount = whileCount + 1;
                        if (whileCount > 10) {
                            break;
                        }
                    }

                    enableFieldArray.push(enableField);
                }
                for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                    writeNewValueToClockRegs(enableFieldArray[j], 0, '', g_bNotInvokeUpdateClockRegsTree);
                }

                // remove the recorded module
                index = enabledModules.indexOf(currentNodeName);

                if (index !== -1) {
                    enabledModules.splice(index, 1);
                    enabledModuleFrequencies.splice(index, 1);
                }

                // update node information
                d3.selectAll('g.node').each(function (d) {
                    if (d.name === currentNodeName) {
                        d.enabled = 0;
                        d.freq = -1;
                    }
                });

                // chain effect
                if (currentNodeName === 'WWDT') {
                    // WDT should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.WDT !== 'undefined' && $.inArray('WDT', enabledModules) !== -1 &&
                        $.inArray('WDT', chainEffectException) === -1) {
                        uncheck_d3node('WDT');
                    }
                }
                else if (currentNodeName === 'WDT') {
                    // WWDT should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.WWDT !== 'undefined' && $.inArray('WWDT', enabledModules) !== -1 &&
                        $.inArray('WWDT', chainEffectException) === -1) {
                        uncheck_d3node('WWDT');
                    }
                }
                if (currentNodeName === 'EWWDT') {
                    // EWDT should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.EWDT !== 'undefined' && $.inArray('EWDT', enabledModules) !== -1 &&
                        $.inArray('EWDT', chainEffectException) === -1) {
                        uncheck_d3node('EWDT');
                    }
                }
                else if (currentNodeName === 'EWDT') {
                    // EWWDT should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.EWWDT !== 'undefined' && $.inArray('EWWDT', enabledModules) !== -1 &&
                        $.inArray('EWWDT', chainEffectException) === -1) {
                        uncheck_d3node('EWWDT');
                    }
                }
                else if (currentNodeName === 'RTC') { // for M451, M460, M480, M0564, NUC126 and NUC200AE
                    // CLKO_1Hz should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.CLKO_1Hz !== 'undefined' && $.inArray('CLKO_1Hz', enabledModules) !== -1 &&
                        $.inArray('CLKO_1Hz', chainEffectException) === -1) {
                        uncheck_d3node('CLKO_1Hz');
                    }
                }
                else if (currentNodeName === 'USBH') {
                    // HSUSBH should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.HSUSBH !== 'undefined' && $.inArray('HSUSBH', enabledModules) !== -1 &&
                        $.inArray('HSUSBH', chainEffectException) === -1) {
                        uncheck_d3node('HSUSBH');
                    }
                }
                else if (currentNodeName === 'HSUSBH') {
                    // USBH should be disabled as well
                    if (typeof NUTOOL_CLOCK.g_Module.USBH !== 'undefined' && $.inArray('USBH', enabledModules) !== -1 &&
                        $.inArray('USBH', chainEffectException) === -1) {
                        uncheck_d3node('USBH');
                    }
                }
            }
        };

        updateSameSelectorOrDividerModules = function (draggingNodeName, selectedNodeName) {
            var i,
                max,
                iindex,
                currentNode,
                updateD3Tree,
                draggingNodeSelector,
                draggingNodeDivider,
                currentNodeSelector,
                currentNodeDivider,
                selectedNode,
                theNode;

            function f1(d) {
                if (d.name === selectedNodeName) {
                    selectedNode = d;
                }
            }

            function f2(d) {
                if (d.name === currentNode) {
                    theNode = d;
                }
            }

            updateD3Tree = function (draggingNodeName, selectedNodeName) {
                var draggingNode1 = null,
                    selectedNode1 = null,
                    index;

                if (selectedNodeName === "") {
                    return true;
                }

                d3.selectAll('g.node').each(function (d) {
                    if (d.name === selectedNodeName) {
                        selectedNode1 = d;
                    }
                });

                d3.selectAll('g.node').each(function (d) {
                    if (d.name === draggingNodeName) {
                        draggingNode1 = d;
                    }
                });

                if (draggingNode1 === null || selectedNode1 === null) {
                    return false;
                }

                //if (nodes.length > 1) {
                //  // remove link paths
                //  links = tree.links(nodes);
                //  nodePaths = g_svgGroup.selectAll("path.link")
                //      .data(links, function (d) {
                //          return d.target.id;
                //      }).remove();
                //  // remove child nodes
                //  nodesExit = g_svgGroup.selectAll("g.node")
                //      .data(nodes, function (d) {
                //          return d.id;
                //      }).filter(function (d) {
                //          if (d.id == draggingNode1.id) {
                //              return false;
                //          }
                //          return true;
                //      }).remove();
                //}

                // remove parent link
                g_svgGroup.selectAll('path.link').filter(function (d) {
                    if (d.target.id == draggingNode1.id) {
                        return true;
                    }
                    return false;
                }).remove();

                // now remove the element from the parent, and insert it into the new elements children
                index = draggingNode1.parent.children.indexOf(draggingNode1);
                if (index > -1) {
                    draggingNode1.parent.children.splice(index, 1);
                }
                if (typeof selectedNode1.children !== 'undefined' || typeof selectedNode1._children !== 'undefined') {
                    if (typeof selectedNode1.children !== 'undefined') {
                        selectedNode1.children.push(draggingNode1);
                    } else {
                        selectedNode1._children.push(draggingNode1);
                    }
                } else {
                    selectedNode1.children = [];
                    selectedNode1.children.push(draggingNode1);
                }

                return true;
            };

            if (typeof selectedNodeName === 'undefined') {
                selectedNodeName = "";
            }

            draggingNodeSelector = "";
            draggingNodeDivider = "";
            if (typeof NUTOOL_CLOCK.g_Module[draggingNodeName] !== 'undefined') {
                draggingNodeSelector = NUTOOL_CLOCK.g_Module[draggingNodeName][0];
                draggingNodeDivider = NUTOOL_CLOCK.g_Module[draggingNodeName][2];
            }

            // traverse
            if (draggingNodeSelector.indexOf(s_S) !== -1 || draggingNodeDivider !== 'none') {
                for (i = 0, max = moduleNames.length; i < max; i += 1) {
                    currentNode = moduleNames[i];

                    if (currentNode !== draggingNodeName && typeof NUTOOL_CLOCK.g_Module[currentNode] !== 'undefined') {
                        currentNodeSelector = NUTOOL_CLOCK.g_Module[currentNode][0];
                        currentNodeDivider = NUTOOL_CLOCK.g_Module[currentNode][2];

                        if ((draggingNodeSelector.indexOf(s_S) !== -1 &&
                            currentNodeSelector.slicePriorToX('/').toString() === draggingNodeSelector.slicePriorToX('/').toString()) ||
                            (currentNodeDivider !== 'none' &&
                                currentNodeDivider === draggingNodeDivider)) {
                            d3.selectAll('g.node').each(f1);
                            d3.selectAll('g.node').each(f2);

                            // update the module frequency
                            // Same selector
                            if (selectedNodeName !== "") {
                                if (updateD3Tree(currentNode, selectedNodeName) && selectedNode.enabled && theNode.enabled) {
                                    iindex = $.inArray(currentNode, enabledModules);
                                    if (iindex !== -1) {
                                        // remove old data
                                        enabledModules.splice(iindex, 1);
                                        enabledModuleFrequencies.splice(iindex, 1);
                                        // add new data
                                        createModuleOnly('tab-4', currentNode, '', '');
                                        enabledModules.push(currentNode);
                                        theNode.freq = $("#" + currentNode + "_span_showRealFreq").text();
                                        enabledModuleFrequencies.push(theNode.freq);
                                    }
                                }
                                else if (!selectedNode.enabled && theNode.enabled) {
                                    uncheck_d3node(theNode.name);
                                }
                            }
                            // Same divider
                            else if (theNode.enabled) {
                                iindex = $.inArray(currentNode, enabledModules);
                                if (iindex !== -1) {
                                    // remove old data
                                    enabledModules.splice(iindex, 1);
                                    enabledModuleFrequencies.splice(iindex, 1);
                                    // add new data
                                    createModuleOnly('tab-4', currentNode, '', '');
                                    enabledModules.push(currentNode);
                                    theNode.freq = $("#" + currentNode + "_span_showRealFreq").text();
                                    enabledModuleFrequencies.push(theNode.freq);
                                }
                            }
                        }
                    }
                }
            }
        };

        ///////////////////////////////////////////////// d3 main code start here ///////////////////////////////////////////////////
        if (isFieldBe1(sOSC10K_EN)) {
            enabledModules.push(sLIRC);
            enabledModuleFrequencies.push(g_realLIRCoutputClock.toHzString());
        }
        if (isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN')) {
            enabledModules.push(sHIRC);
            enabledModuleFrequencies.push(g_realHIRCoutputClock.toHzString());
        }
        if (isFieldBe1(sOSC22M2_EN) || isFieldBe1('HIRC2EN')) {
            enabledModules.push(sHIRC2);
            enabledModuleFrequencies.push(g_realHIRC2outputClock.toHzString());
        }
        if (isFieldBe1('HIRC48EN')) {
            enabledModules.push('HIRC48');
            enabledModuleFrequencies.push(g_realHIRC48outputClock.toHzString());
        }
        if (isFieldBe1('MIRCEN')) {
            enabledModules.push('MIRC');
            enabledModuleFrequencies.push(g_realMIRCoutputClock.toHzString());
        }
        if (isFieldBe1('MIRC1P2MEN')) {
            enabledModules.push('MIRC1P2M');
            enabledModuleFrequencies.push(g_realMIRC1P2MoutputClock.toHzString());
        }
        if (g_realRTC32koutputClock !== 0) {
            enabledModules.push('RTC32k');
            enabledModuleFrequencies.push(g_realRTC32koutputClock.toHzString());
        }
        if (isFieldBe1(sXTL32K_EN) || isFieldBe1('LIRC32KEN')) {
            enabledModules.push(sLXT);
            enabledModuleFrequencies.push(g_realLXToutputClock.toHzString());
        }
        if (isFieldBe1(sXTL12M_EN)) {
            enabledModules.push(sHXT);
            enabledModuleFrequencies.push(g_realHXToutputClock.toHzString());
        }

        // determine the content of PLL node
        if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
            if (checkForField('PLLSRCSEL')) {
                switch (readValueFromClockRegs('PLLSRCSEL')) {
                    case 1:
                        HXTChildren.push(sPLL);
                        break;
                    default:
                    case 0:
                        HIRCChildren.push(sPLL);
                        break;
                }
            }
            else {
                switch (readValueFromClockRegs('PLL_SRC')) {
                    case 1:
                        HIRCChildren.push(sPLL);
                        break;
                    case 2:
                    case 3:
                        MIRCChildren.push(sPLL);
                        break;
                    case 0:
                        HXTChildren.push(sPLL);
                        break;
                    default: // only one source
                        if (isFieldBe1(sOSC10K_EN)) {
                            HIRCChildren.push(sPLL);
                        }
                        else if (isFieldBe1('MIRCEN')) {
                            MIRCChildren.push(sPLL);
                        }
                        else {
                            HXTChildren.push(sPLL);
                        }
                        break;
                }
            }
            if ((!isFieldBe1('PD') || isFieldBe1('PLLEN')) &&
                $.inArray(sPLL, g_enabledBaseClocks) !== -1) {
                enabledModules.push(sPLL);
                enabledModuleFrequencies.push(g_realPLLoutputClock.toHzString());
            }
        }
        // determine the content of PLLFN node (M460)
        if (typeof NUTOOL_CLOCK.g_register_map['PLLFNCTL1'] !== 'undefined') {
            switch (readValueFromClockRegs('PLLFNSRC')) {
                case 0:
                    HXTChildren.push('PLLFN');
                    break;
                case 1:
                    HIRCChildren.push('PLLFN');
                    break;
            }
            if (!isFieldBe1('PDFN') &&
                $.inArray('PLLFN', g_enabledBaseClocks) !== -1) {
                enabledModules.push('PLLFN');
                enabledModuleFrequencies.push(g_realPLLFNoutputClock.toHzString());
            }
        }
        // determine the content of PLL2 node
        if (typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined') {
            HXTChildren.push('PLL2');
            if (isFieldBe1('PLL2CKEN') &&
                $.inArray('PLL2', g_enabledBaseClocks) !== -1) {
                enabledModules.push('PLL2');
                enabledModuleFrequencies.push(g_realPLL2outputClock.toHzString());
            }
        }
        // determine the content of PLL480M node
        if (NUTOOL_CLOCK.g_PLL480Mfrequency !== 0) {
            HXTChildren.push('PLL480M');
            if (isFieldBe1('PLL2CKEN') &&
                $.inArray('PLL480M', g_enabledBaseClocks) !== -1) {
                enabledModules.push('PLL480M');
                enabledModuleFrequencies.push(g_realPLL480MoutputClock.toHzString());
            }
        }
        // determine the content of APLL node
        if (typeof NUTOOL_CLOCK.g_register_map.APLLCTL !== 'undefined') {
            HXTChildren.push('APLL');
            if (!isFieldBe1('APD') &&
                $.inArray('APLL', g_enabledBaseClocks) !== -1) {
                enabledModules.push('APLL');
                enabledModuleFrequencies.push(g_realAPLLoutputClock.toHzString());
            }
        }
        // determine the content of HSUSB_OTG_PHY node
        if (NUTOOL_CLOCK.g_HSUSBOTGPHYfrequency !== 0) {
            HXTChildren.push('HSUSB_OTG_PHY');
            if (isFieldBe1(sXTL12M_EN) &&
                $.inArray('HSUSB_OTG_PHY', g_enabledBaseClocks) !== -1) {
                enabledModules.push('HSUSB_OTG_PHY');
                enabledModuleFrequencies.push(g_realHSUSBOTGPHYoutputClock.toHzString());
            }
        }
        // determine the content of HCLK node
        selectField = sHCLK_S;
        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
            for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
                fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][i];
                oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);

                if (oldSelectorOrDividerValue === newSelectorOrDividerValue) {
                    fullFieldName = fullFieldName.slicePriorToX(':').slicePriorToX('/').toString();
                    pushRelationshipChildren(fullFieldName, sHCLK);

                    break;
                }
                else if (i === max - 1) {
                    if (!g_bReadyForRelease && window.console) { window.console.log('"ERROR! createD3ClockTree has an error: HCLK cannot find its clock source.'); }
                }
            }
        }
        enabledModules.push(sHCLK);
        enabledModuleFrequencies.push(g_realHCLKoutputClock.toHzString());

        // determine the content of CPUCLK node
        if (sHCLK !== 'CPUCLK') {
            HCLKChildren.push('CPUCLK');
            enabledModules.push('CPUCLK');
            enabledModuleFrequencies.push(g_realHCLKoutputClock.toHzString());
        }

        if (g_realPCLKoutputClock > 0) {
            pushRelationshipChildren(sHCLK, sPCLK);
            enabledModules.push(sPCLK);
            enabledModuleFrequencies.push(g_realPCLKoutputClock.toHzString());
        }
        if (g_realPCLK0outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK0SEL'.toEquivalent().toString())) {
            pushRelationshipChildren(sHCLK, 'PCLK0');
            enabledModules.push('PCLK0');
            enabledModuleFrequencies.push(g_realPCLK0outputClock.toHzString());
        }
        if (g_realPCLK1outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK1SEL'.toEquivalent().toString())) {
            pushRelationshipChildren(sHCLK, 'PCLK1');
            enabledModules.push('PCLK1');
            enabledModuleFrequencies.push(g_realPCLK1outputClock.toHzString());
        }
        if (g_realPCLK2outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK2SEL'.toEquivalent().toString())) {
            pushRelationshipChildren(sHCLK, 'PCLK2');
            enabledModules.push('PCLK2');
            enabledModuleFrequencies.push(g_realPCLK2outputClock.toHzString());
        }

        // these will be located at the 2nd level.
        rootChildren = [];
        if (NUTOOL_CLOCK.g_LIRCfrequency !== 0) {
            rootChildren.push(sLIRC);
        }
        if (NUTOOL_CLOCK.g_HIRCfrequency !== 0) {
            rootChildren.push(sHIRC);
        }
        if (NUTOOL_CLOCK.g_HIRC2frequency !== 0) {
            rootChildren.push(sHIRC2);
        }
        if (NUTOOL_CLOCK.g_HIRC48frequency !== 0) {
            rootChildren.push('HIRC48');
        }
        if (NUTOOL_CLOCK.g_MIRCfrequency !== 0) {
            rootChildren.push('MIRC');
        }
        if (NUTOOL_CLOCK.g_MIRC1P2Mfrequency !== 0) {
            rootChildren.push('MIRC1P2M');
        }
        if (NUTOOL_CLOCK.g_RTC32kfrequency !== 0) {
            rootChildren.push('RTC32k');
        }
        if (checkForField(sXTL32K_EN + ':')) {
            rootChildren.push(sLXT);
        }
        if (checkForField(sXTL12M_EN + ':')) {
            rootChildren.push(sHXT);
        }
        // determine the content of module nodes
        for (k = 0, maxK = inputModule.length; k < maxK; k += 1) {
            moduleName = inputModule[k];
            if (moduleName !== 'SYSTICK') {
                selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
            }
            else {
                if (isFieldBe1('CLKSRC')) {
                    selectField = 'CPUCLK';
                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sSTCLK_S)) {
                        selectField = sSTCLK_S;
                    }
                    else {
                        selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                    }
                }
            }

            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
                    if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectField)) {
                        oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                    }
                    else {
                        selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectField][0];
                        selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                        selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                        oldSelectorOrDividerValue = readValueFromClockRegs(selectField) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;
                    }

                    fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][i];
                    newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);

                    if (oldSelectorOrDividerValue === newSelectorOrDividerValue) {
                        fullFieldName = fullFieldName.slicePriorToX(':').slicePriorToX('/').toString();
                        pushRelationshipChildren(fullFieldName, moduleName);
                        selectField = fullFieldName;

                        break;
                    }
                    else if (i === max - 1) {
                        fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][0];
                        newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                        // remember to update g_clockRegs
                        writeNewValueToClockRegs(selectField, newSelectorOrDividerValue, false, false);
                        fullFieldName = fullFieldName.slicePriorToX(':').slicePriorToX('/').toString();
                        pushRelationshipChildren(fullFieldName, moduleName);
                        selectField = fullFieldName;
                    }
                }
            }
            else {
                selectField = selectField.slicePriorToX('/').toString();
                pushRelationshipChildren(selectField, moduleName);
            }
            // based on the clock registers, determine what has been enabled.
            enableField = NUTOOL_CLOCK.g_Module[moduleName][1];
            enableFieldArray = [];
            whileCount = 0;
            if (enableField.indexOf('/') === -1) {
                enableFieldArray.push(enableField);
            }
            else {
                while (enableField.indexOf('/') !== -1) {
                    enableFieldArray.push(enableField.slicePriorToX('/'));
                    enableField = enableField.sliceAfterX('/');

                    whileCount = whileCount + 1;
                    if (whileCount > 10) {
                        break;
                    }
                }

                enableFieldArray.push(enableField);
            }
            bChecked = true;
            for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                if (!isEnabled(enableFieldArray[j])) {
                    bChecked = false;
                    break;
                }
            }

            if (bChecked) {
                if ($.inArray(selectField, enabledModules) !== -1) {
                    enabledModules.push(moduleName);
                    createModuleOnly('tab-4', moduleName, '', '');
                    enabledModuleFrequencies.push($("#" + moduleName + "_span_showRealFreq").text());
                }
                else {
                    uncheck_d3node(moduleName);
                }
            }
        }

        // populate the D3-generated tree
        treeData.name = g_partNumber_package.slicePriorToX('(');
        treeData.enabled = 1;
        treeData.freq = -1;
        treeData.children = populateD3Tree(rootChildren);

        // we are unable to manipulate any node affiliated with rootChildren in the D3 tree.
        rootChildren.push(sPLL, 'PLL2', 'PLL480M', 'APLL', 'PLLFN', 'HSUSB_OTG_PHY', sHCLK, sPCLK, 'PCLK0', 'PCLK1', 'PCLK2', 'CPUCLK');

        // Calculate total nodes, max label length
        totalNodes = 0;
        maxLabelLength = 0;
        // variables for drag/drop
        selectedNode = null;
        draggingNode = null;
        // panning variables
        //var panSpeed = 200;
        //var panBoundary = 20; // Within 20px from edges will pan when dragging.
        // Misc. variables
        //var i = 0;
        duration = 750;
        dragOngoing = false;
        // size of the diagram
        viewerWidth = window.screen.width - 250;//$tabs.width();//g_NUC_TreeView_Height - 8;
        viewerHeight = window.screen.height - 250;//g_NUC_TreeView_Height;//$tabs.height();//g_Dialog_Width - g_NUC_TreeView_Width - 8;

        tree = d3.layout.tree()
            .size([viewerHeight, viewerWidth])
            .nodeSize([15, 70]); // used to specify the separation between nodes.

        // define a d3 diagonal projection for use by the node paths later on.
        diagonal = d3.svg.diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });

        // A recursive helper function for performing some setup by walking through all nodes
        function visit(parent, visitFn, childrenFn) {
            var children = childrenFn(parent),
                i,
                count;

            if (!parent) { return; }

            visitFn(parent);

            if (children) {
                count = children.length;
                for (i = 0; i < count; i++) {
                    visit(children[i], visitFn, childrenFn);
                }
            }
        }

        // Call visit function to establish maxLabelLength
        visit(treeData, function (d) {
            totalNodes++;
            maxLabelLength = Math.max(d.name.length, maxLabelLength);

        }, function (d) {
            return d.children && d.children.length > 0 ? d.children : null;
        });

        // sort the tree according to the node names
        function sortTree() {
            tree.sort(function (a, b) {
                return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
            });
        }
        // Sort the tree initially in case the JSON isn't in a sorted order.
        sortTree();

        // TODO: Pan function, can be better implemented.
        //var panTimer;
        //function pan(domNode, direction) {
        //  var speed = panSpeed,
        //      translateCoords,
        //      translateX,
        //      translateY,
        //      scaleX,
        //      scaleY,
        //      scale;

        //  if (panTimer) {
        //      clearTimeout(panTimer);
        //      translateCoords = d3.transform(g_svgGroup.attr("transform"));
        //      if (direction == 'left' || direction == 'right') {
        //          translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
        //          translateY = translateCoords.translate[1];
        //      } else if (direction == 'up' || direction == 'down') {
        //          translateX = translateCoords.translate[0];
        //          translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
        //      }
        //      scaleX = translateCoords.scale[0];
        //      scaleY = translateCoords.scale[1];
        //      scale = zoomListener.scale();
        //      g_svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
        //      d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
        //      zoomListener.scale(zoomListener.scale());
        //      zoomListener.translate([translateX, translateY]);
        //      panTimer = setTimeout(function () {
        //          pan(domNode, speed, direction);
        //      }, 50);
        //  }
        //}

        // Define the zoom function for the zoomable tree
        function zoom() {
            if (!g_bReadyForRelease && window.console) { window.console.log("In zoom, d3.event.translate:" + d3.event.translate + " / d3.event.scale:" + d3.event.scale); }
            g_svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
        zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

        // Define the drag listeners for baseSvg.
        basedragListener = d3.behavior.drag()
            .on("dragstart", function () {
                // hide the module chart
                if ($('#' + g_recordedCheckedNode + '_div')[0]) {
                    $('#' + g_recordedCheckedNode + '_div').hide();
                    $('#' + g_recordedCheckedNode + '_canvas').hide();
                    $('#' + g_recordedCheckedNode + '_div_protection').hide();
                    $('#' + g_recordedCheckedNode + '_div_showRealFreq').hide();
                }
            });

        // define the baseSvg, attaching a class for styling and the zoomListener
        baseSvg = d3.select("#tab-4").append("svg")
            .attr("width", viewerWidth)
            .attr("height", viewerHeight)
            .attr("class", "overlay")
            .call(basedragListener)
            .call(zoomListener).on("dblclick.zoom", null) // avoid provoking the zoom handler when the user double clicks the tree.
            .on("mouseover", function () {
                d3.select(this).classed("baseDraggable", true);
            }).on("mouseout", function () {
                d3.select(this).classed("baseDraggable", false);
            });

        if ($('html').hasClass('ie10+')) {
            $("#tab-4").dblclick(function () {
                if (!bDblClikedOnNode) {
                    generateCode('reviewReport');
                }
                bDblClikedOnNode = false;
            });
        }

        tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
            var tooptipContent = "",
                tempString = "",
                tempString1 = "",
                tempArray = [],
                sIsEnabled_inner,
                sIsDisabled_inner,
                sDoubleClickingEnable_inner,
                sDoubleClickingDisable_inner,
                sDraggingNode_inner,
                sClickingShowDetails_inner,
                sDoubldClickingShowDetails_inner,
                sItHas_inner,
                sClockForUse_inner,
                sActivator_inner,
                sSelector_inner,
                sDivider_inner,
                sBusClock_inner,
                sEngineClock_inner;

            if (!dragOngoing) {
                //window.alert(d3.select('#Num' + d.id).classed("notDraggable"))
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    sIsEnabled_inner = "启用中。";
                    sIsDisabled_inner = "停用中。";
                    sDoubleClickingEnable_inner = "双击节点可以启用它。";
                    sDoubleClickingDisable_inner = "双击节点可以停用它。";
                    sDraggingNode_inner = "拖曳节点至其中一个蓝色节点</br>可以改变其时脉源。</br>滚动鼠标滚轮来放大或缩小。</br>双击背景可以检阅报告。";
                    sClickingShowDetails_inner = "单击节点可以显示其细部。";
                    sDoubldClickingShowDetails_inner = "双击节点可以显示其细部。";
                    sItHas_inner = "它有";
                    sClockForUse_inner = "個时脉源可供使用:";
                    sActivator_inner = "启用器: ";
                    sSelector_inner = "选择器: ";
                    sDivider_inner = "除法器: ";
                    sBusClock_inner = "汇流排频率";
                    sEngineClock_inner = "引擎频率";
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    sIsEnabled_inner = "啟用中。";
                    sIsDisabled_inner = "停用中。";
                    sDoubleClickingEnable_inner = "雙擊節點可以啟用它。";
                    sDoubleClickingDisable_inner = "雙擊節點可以停用它。";
                    sDraggingNode_inner = "拖曳節點至其中一個藍色節點</br>可以改變其時脈源。</br>滾動鼠標滾輪來放大或縮小。</br>雙擊背景可以檢閱報告。";
                    sClickingShowDetails_inner = "單擊節點可以顯示其細部。";
                    sDoubldClickingShowDetails_inner = "雙擊節點可以顯示其細部。";
                    sItHas_inner = "它有";
                    sClockForUse_inner = "個時脈源可供使用:";
                    sActivator_inner = "啟用器: ";
                    sSelector_inner = "選擇器: ";
                    sDivider_inner = "除法器: ";
                    sBusClock_inner = "匯流排頻率";
                    sEngineClock_inner = "引擎頻率";
                }
                else {
                    sIsEnabled_inner = " is enabled.";
                    sIsDisabled_inner = " is disabled.";
                    sDoubleClickingEnable_inner = "Dblclicking on the node can enable it.";
                    sDoubleClickingDisable_inner = "Dblclicking on the node can disable it.";
                    sDraggingNode_inner = "Dragging the node into one of the blue nodes</br>can change its clock source.</br>Rolling the mouse wheel can zoom in or out.</br>Dblclicking on the background can review report.";
                    sClickingShowDetails_inner = "Clicking on the node can show details.";
                    sDoubldClickingShowDetails_inner = "Dblclicking on the node can show details.";
                    sItHas_inner = "It has ";
                    sClockForUse_inner = " clock sources for use:";
                    sActivator_inner = "Activator: ";
                    sSelector_inner = "Selector: ";
                    sDivider_inner = "Divider: ";
                    sBusClock_inner = "Bus Clock";
                    sEngineClock_inner = "Engine Clock";
                }

                moduleName = d.name;
                if (moduleName !== 'SYSTICK') {
                    if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
                        selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                    }
                    else {
                        selectField = moduleName + s_S;
                    }

                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                        for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
                            tempString = NUTOOL_CLOCK.g_CLKSEL[selectField][i].slicePriorToX(':').slicePriorToX('/').toString();

                            if ($.inArray(tempString, tempArray) === -1) {
                                tempArray.push(tempString);
                            }
                        }
                    }
                    else if (selectField !== moduleName + s_S) {
                        tempArray.push(selectField);
                    }
                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sSTCLK_S)) {
                        for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[sSTCLK_S].length; i < max; i += 1) {
                            tempString = NUTOOL_CLOCK.g_CLKSEL[sSTCLK_S][i].slicePriorToX(':').slicePriorToX('/').toString();

                            if ($.inArray(tempString, tempArray) === -1) {
                                tempArray.push(tempString);
                            }
                        }
                    }
                    else {
                        tempArray.push(NUTOOL_CLOCK.g_Module[moduleName][0].slicePriorToX('/').toString());
                    }
                }

                // generate the content of the tooltip
                // current status and operation hints
                tooptipContent = moduleName;// + " is ";
                if (d.enabled) {
                    if (d !== root && $.inArray(moduleName, rootChildren) === -1) {
                        tooptipContent = tooptipContent + sIsEnabled_inner + "</br>(" + sDoubleClickingDisable_inner;

                        if (!$('#' + g_recordedCheckedNode + '_div').is(':visible') || g_recordedCheckedNode !== moduleName) {
                            tooptipContent = tooptipContent + "</br>" + sClickingShowDetails_inner;//"</br>Clicking on the node can show details.";
                        }

                        tooptipContent = tooptipContent + "</br>" + sDraggingNode_inner;
                    }
                    else {
                        tooptipContent = tooptipContent + sIsEnabled_inner + "</br>(" + sDoubldClickingShowDetails_inner;
                    }

                    tooptipContent = tooptipContent + ")</br>";
                }
                else {
                    if (d !== root && $.inArray(moduleName, rootChildren) === -1) {
                        tooptipContent = tooptipContent + sIsDisabled_inner + "</br>(" + sDoubleClickingEnable_inner + "</br>" + sDraggingNode_inner + ")</br>";
                    }
                    else {
                        tooptipContent = tooptipContent + sIsDisabled_inner + "</br>(" + sDoubldClickingShowDetails_inner + ")</br>";
                    }
                }
                // clock sources for use
                if (tempArray.length > 0) {
                    tooptipContent = tooptipContent + "<hr>";
                    tooptipContent = tooptipContent + sItHas_inner + tempArray.length + sClockForUse_inner + "</br>";

                    for (i = 0, max = tempArray.length; i < max; i += 1) {
                        tooptipContent = tooptipContent + (i + 1) + '. ' + tempArray[i] + '</br>';
                    }
                }
                // Activator, Selector and Divider
                if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
                    tooptipContent = tooptipContent + "<hr>";

                    // parse enable field
                    enableField = NUTOOL_CLOCK.g_Module[moduleName][1];
                    enableFieldArray = [];
                    whileCount = 0;
                    if (enableField.indexOf('/') === -1) {
                        enableFieldArray.push(enableField);
                    }
                    else {
                        while (enableField.indexOf('/') !== -1) {
                            enableFieldArray.push(enableField.slicePriorToX('/'));
                            enableField = enableField.sliceAfterX('/');

                            whileCount = whileCount + 1;
                            if (whileCount > 10) {
                                break;
                            }
                        }

                        enableFieldArray.push(enableField);
                    }
                    tooptipContent = tooptipContent + sActivator_inner;
                    for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                        tempString = retrieveClockField(enableFieldArray[j]);
                        if (j !== 0 && tempString !== "") {
                            tooptipContent = tooptipContent + " / ";
                        }

                        tooptipContent = tooptipContent + tempString;
                    }
                    tooptipContent = tooptipContent + "</br>";

                    // parse selector field
                    selectFieldArray = [];
                    if (NUTOOL_CLOCK.g_Module[moduleName][0].indexOf(s_S) !== -1) {
                        selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                        whileCount = 0;
                        if (selectField.indexOf('/') === -1) {
                            selectFieldArray.push(selectField);
                        }
                        else {
                            while (selectField.indexOf('/') !== -1) {
                                selectFieldArray.push(selectField.slicePriorToX('/'));
                                selectField = selectField.sliceAfterX('/');

                                whileCount = whileCount + 1;
                                if (whileCount > 10) {
                                    break;
                                }
                            }

                            selectFieldArray.push(selectField);
                        }

                        tooptipContent = tooptipContent + sSelector_inner;
                        for (j = 0, maxJ = selectFieldArray.length; j < maxJ; j += 1) {
                            if (j !== 0 && !isNumberic(selectFieldArray[j])) {
                                tooptipContent = tooptipContent + " / ";
                            }

                            tooptipContent = tooptipContent + retrieveClockField(selectFieldArray[j]);

                            if (NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectFieldArray[j])) {
                                tooptipContent = tooptipContent + " / " +
                                    retrieveClockField(NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectFieldArray[j]][0].slicePriorToX(':'));
                            }
                        }
                        tooptipContent = tooptipContent + "</br>";
                    }
                    if (selectFieldArray.length === 0 && moduleName === 'SYSTICK') {
                        tooptipContent = tooptipContent + sSelector_inner + sSYST_CSR + "[2]" + "</br>";
                    }

                    // parse divider field
                    if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                        tooptipContent = tooptipContent + sDivider_inner + retrieveClockField(NUTOOL_CLOCK.g_Module[moduleName][2]) + "</br>";
                    }
                }
                else if (moduleName === sPLL || moduleName === 'APLL' || moduleName === 'PLLFN') {
                    enableFieldArray = ['PD', 'OE', 'PLLEN', 'PDFN', "OEFN", 'PLLFN'];
                    tooptipContent = tooptipContent + "<hr>" + sActivator_inner;
                    for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                        if ((tooptipContent.lastIndexOf(sActivator_inner) + sActivator_inner.length) !== tooptipContent.length &&
                            retrieveClockField(enableFieldArray[j]) !== "") {
                            tooptipContent = tooptipContent + " / ";
                        }

                        tooptipContent = tooptipContent + retrieveClockField(enableFieldArray[j]);
                    }
                    selectFieldArray = ['PLL_SRC', 'PLLSRC', 'PLLSRCSEL'];
                    for (j = 0, maxJ = selectFieldArray.length; j < maxJ; j += 1) {
                        if (retrieveClockField(selectFieldArray[j]) !== "") {
                            tooptipContent = tooptipContent + "</br>";
                            tooptipContent = tooptipContent + sSelector_inner;
                            tooptipContent = tooptipContent + retrieveClockField(selectFieldArray[j]);
                            break;
                        }
                    }
                    tooptipContent = tooptipContent + "</br>";
                }
                else {
                    tempString = "";
                    tempString1 = "";

                    switch (moduleName) {
                        case sLIRC:
                            tempString = retrieveClockField(sOSC10K_EN);
                            break;
                        case sHIRC:
                            tempString = retrieveClockField(sOSC22M_EN);
                            if (retrieveClockField('HIRC1EN') !== "") {
                                tempString = tempString + " / " + retrieveClockField('HIRC1EN');
                            }
                            break;
                        case sHIRC2:
                            tempString = retrieveClockField(sOSC22M2_EN);
                            if (retrieveClockField('HIRC2EN') !== "") {
                                tempString = tempString + " / " + retrieveClockField('HIRC2EN');
                            }
                            break;
                        case 'HIRC48':
                            tempString = retrieveClockField('HIRC48EN');
                            break;
                        case 'MIRC':
                            tempString = retrieveClockField('MIRCEN');
                            break;
                        case 'MIRC1P2M':
                            tempString = retrieveClockField('MIRC1P2MEN');
                            break;
                        case sLXT:
                            tempString = retrieveClockField(sXTL32K_EN);
                            break;
                        case sHXT:
                            tempString = retrieveClockField(sXTL12M_EN);
                            break;
                        case 'PLL2':
                            tempString = retrieveClockField('PLL2CKEN');
                            break;
                        case 'PLL480M':
                            tempString = retrieveClockField('PLL2CKEN');
                            break;
                        case 'HSUSB_OTG_PHYOTGPHY':
                            tempString = retrieveClockField(sXTL12M_EN);
                            break;
                        default:
                            break;
                    }

                    if (tempString !== "") {
                        //tempString1 = tempString1 + "<hr>";
                        tempString1 = tempString1 + sActivator_inner + tempString + "</br>";
                    }
                    tempString = retrieveClockField(moduleName + s_S);
                    if (tempString !== "") {
                        tempString1 = tempString1 + sSelector_inner + tempString + "</br>";
                    }
                    tempString = retrieveClockField(moduleName + 'DIV');
                    if (tempString !== "") {
                        tempString1 = tempString1 + sDivider_inner + tempString + "</br>";
                    }

                    if (tempString1 !== "") {
                        tooptipContent = tooptipContent + "<hr>" + tempString1;
                    }
                }
            }

            // Bus clock and Engine clock
            if (d.enabled && NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
                if (hasBusClockOrNot(moduleName)) {
                    tooptipContent = tooptipContent + "<hr>";
                    tooptipContent = tooptipContent + sBusClock_inner + " " + findBusClock(moduleName) + "</br>";
                    if (hasEngineClockOrNot(moduleName)) {
                        tooptipContent = tooptipContent + sEngineClock_inner + " (" + moduleName + "): " + d.freq + "</br>";
                    }
                }
            }
            g_tooptipContent = tooptipContent;

            return tooptipContent;
        });
        baseSvg.call(tip);
        tip.direction('e').offset([0, 5]);

        function initiateDrag(d, domNode) {
            var tempArray = [];

            if (!g_bReadyForRelease && window.console) { window.console.log("In initiateDrag"); }

            removeAlldialogs();

            draggingNode = d;

            g_svgGroup.selectAll("g.node").sort(function (a) { // select the parent and sort the path's
                if (a.id != draggingNode.id) { return 1; } // a is not the hovered element, send "a" to the back
                else { return -1; } // a is the hovered element, bring "a" to the front
            });

            // if nodes has children, remove the links and nodes
            //if (nodes.length > 1) {
            //  // remove link paths
            //  links = tree.links(nodes);
            //  nodePaths = g_svgGroup.selectAll("path.link")
            //      .data(links, function (d) {
            //          return d.target.id;
            //      }).remove();
            //  // remove child nodes
            //  nodesExit = g_svgGroup.selectAll("g.node")
            //      .data(nodes, function (d) {
            //          return d.id;
            //      }).filter(function (d) {
            //          if (d.id == draggingNode.id) {
            //              return false;
            //          }
            //          return true;
            //      }).remove();
            //}

            // remove parent link
            g_svgGroup.selectAll('path.link').filter(function (d) {
                if (d.target.id == draggingNode.id) {
                    return true;
                }
                return false;
            }).remove();

            // lighten the allowable candidates
            moduleName = draggingNode.name;
            if (moduleName !== 'SYSTICK') {
                if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
                    selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                }
                else {
                    selectField = moduleName + s_S;
                }

                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                    for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
                        tempArray.push(NUTOOL_CLOCK.g_CLKSEL[selectField][i].slicePriorToX(':').slicePriorToX('/').toString());
                    }
                }
            }
            else {
                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sSTCLK_S)) {
                    selectField = sSTCLK_S;
                }
                else {
                    selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                }

                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                    for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
                        tempArray.push(NUTOOL_CLOCK.g_CLKSEL[selectField][i].slicePriorToX(':').slicePriorToX('/').toString());
                    }
                }
                else {
                    tempArray.push(selectField.slicePriorToX('/').toString());
                }
            }

            g_svgGroup.selectAll("g.node")
                .data(tree.nodes(root), function (d) {
                    return d.id || (d.id = ++i);
                })
                .select("circle.nodeCircle")
                .style("fill", function (d) {
                    var returnValue = false;

                    if ((tempArray.length > 0 && $.inArray(d.name, tempArray) !== -1) || d.name === selectField) {
                        returnValue = true;
                    }

                    return returnValue ? "blue" : "#41AF88";
                });

            // show ghostCircles of the allowable candidates
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
            d3.selectAll('.ghostCircle')
                .data(tree.nodes(root), function (d) {
                    return d.id || (d.id = ++i);
                })
                .attr('class', function (d) {
                    var returnValue = false;

                    if ((tempArray.length > 0 && $.inArray(d.name, tempArray) !== -1) || d.name === selectField) {
                        returnValue = true;
                    }
                    return returnValue ? "ghostCircle show" : "ghostCircle";
                });
            d3.select(domNode).attr('class', 'node activeDrag');

            bDragStarted = false;
        }

        // Define the drag listeners for drag/drop behavior of nodes.
        dragListener = d3.behavior.drag()
            .on("dragstart", function (d) {
                if (!g_bReadyForRelease && window.console) { window.console.log("In dragstart, d.name: " + d.name); }
                if (d == root || $.inArray(d.name, rootChildren) !== -1) {
                    return;
                }

                // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
                d3.event.sourceEvent.stopPropagation();

                // hide the module chart
                if ($('#' + g_recordedCheckedNode + '_div')[0]) {
                    $('#' + g_recordedCheckedNode + '_div').hide();
                    $('#' + g_recordedCheckedNode + '_canvas').hide();
                    $('#' + g_recordedCheckedNode + '_div_protection').hide();
                    $('#' + g_recordedCheckedNode + '_div_showRealFreq').hide();
                }

                // remove old selected paths
                g_svgGroup.selectAll("path.selected")
                    .data([])
                    .exit().remove();

                bDragStarted = true;
                nodes = tree.nodes(d);
            })
            .on("drag", function (d) {
                var node;

                if (!g_bReadyForRelease && window.console) { window.console.log("In drag, d.name: " + d.name); }

                dragOngoing = true;

                if (d == root || $.inArray(d.name, rootChildren) !== -1) {
                    return;
                }
                if (bDragStarted) {
                    domNode = this;
                    initiateDrag(d, domNode);
                }

                // get coords of mouseEvent relative to svg container to allow for panning
                //relCoords = d3.mouse($('svg').get(0));
                //if (relCoords[0] < panBoundary) {
                //  panTimer = true;
                //  pan(this, 'left');
                //} else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                //  panTimer = true;
                //  pan(this, 'right');
                //} else if (relCoords[1] < panBoundary) {
                //  panTimer = true;
                //  pan(this, 'up');
                //} else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                //  panTimer = true;
                //  pan(this, 'down');
                //} else {
                //  try {
                //      clearTimeout(panTimer);
                //  } catch (e) {

                //  }
                //}

                d.x0 += d3.event.dy;
                d.y0 += d3.event.dx;

                node = d3.select(this);
                node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");

                updateTempConnector();
            }).on("dragend", function (d) {
                var index,
                    iindex,
                    selectedNodeName,
                    draggingNodeName;

                if (!g_bReadyForRelease && window.console) { window.console.log("In dragend, d.name: " + d.name); }

                dragOngoing = false;

                if (d == root || $.inArray(d.name, rootChildren) !== -1) {
                    return;
                }

                domNode = this;
                if (selectedNode) {
                    // now remove the element from the parent, and insert it into the new elements children
                    index = draggingNode.parent.children.indexOf(draggingNode);
                    if (index > -1) {
                        draggingNode.parent.children.splice(index, 1);
                    }
                    if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                        if (typeof selectedNode.children !== 'undefined') {
                            selectedNode.children.push(draggingNode);
                        } else {
                            selectedNode._children.push(draggingNode);
                        }
                    } else {
                        selectedNode.children = [];
                        selectedNode.children.push(draggingNode);
                    }

                    // update selectField
                    newSelectorOrDividerValue = oldSelectorOrDividerValue = -1;
                    selectedNodeName = selectedNode.name;
                    draggingNodeName = draggingNode.name;
                    if (draggingNodeName !== 'SYSTICK') {
                        selectField = NUTOOL_CLOCK.g_Module[draggingNodeName][0];
                        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                            for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                if (fullFieldName.slicePriorToX(':').slicePriorToX('/').toString() === selectedNodeName) {
                                    if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectField)) {
                                        oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                                        newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                        writeNewValueToClockRegs(selectField, newSelectorOrDividerValue);
                                    }
                                    else {
                                        selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectField][0];
                                        selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                                        selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                                        oldSelectorOrDividerValue = readValueFromClockRegs(selectField) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;

                                        newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                        mask = Math.pow(2, selectFieldNameExtendedShiftBit) - 1;
                                        newSelectorOrDividerValue1 = newSelectorOrDividerValue & mask;
                                        newSelectorOrDividerValue2 = ((newSelectorOrDividerValue - newSelectorOrDividerValue1) >> selectFieldNameExtendedShiftBit) >>> 0;

                                        writeNewValueToClockRegs(selectField, newSelectorOrDividerValue1);
                                        writeNewValueToClockRegs(selectFieldNameExtended, newSelectorOrDividerValue2);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    else {  // for SYSTICK module
                        if (selectedNodeName.indexOf('CPUCLK') !== -1) {
                            writeNewValueToClockRegs('CLKSRC', 1, sSYST_CSR);
                        }
                        else {
                            writeNewValueToClockRegs('CLKSRC', 0, sSYST_CSR);
                            selectField = sSTCLK_S;
                            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                    fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                    if (fullFieldName.indexOf(selectedNodeName) !== -1 /*&& fullFieldName.indexOf(':') === selectedNodeName.length*/) {
                                        writeNewValueToClockRegs(selectField, parseInt(fullFieldName.sliceAfterX(':'), 10), '', false);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // update the module frequency
                    if (selectedNode.enabled) {
                        iindex = $.inArray(draggingNodeName, enabledModules);
                        if (iindex !== -1) {
                            // remove old data
                            enabledModules.splice(iindex, 1);
                            enabledModuleFrequencies.splice(iindex, 1);
                            // add new data
                            createModuleOnly('tab-4', draggingNodeName, '', '');
                            enabledModules.push(draggingNodeName);
                            d.freq = $("#" + draggingNodeName + "_span_showRealFreq").text();
                            enabledModuleFrequencies.push(d.freq);
                        }
                    }
                    else {
                        uncheck_d3node(draggingNodeName);
                    }
                    // handle the case of same selector modules
                    if (newSelectorOrDividerValue !== oldSelectorOrDividerValue) {
                        updateSameSelectorOrDividerModules(draggingNodeName, selectedNodeName);
                    }

                    // Make sure that the node being added to is expanded so user can see added node is correctly moved
                    //expand(selectedNode);
                    sortTree();
                    endDrag();
                } else {
                    endDrag();
                }
            });

        function endDrag() {
            if (!g_bReadyForRelease && window.console) { window.console.log("In endDrag"); }

            selectedNode = null;
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
            //d3.select(domNode).attr('class', 'node');
            // now restore the mouseover event or we won't be able to drag a 2nd time
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
            updateTempConnector();
            update(root);
            // update tooltip
            tip.hide();
        }

        // Helper functions for collapsing and expanding nodes.
        //function collapse(d) {
        //  if (d.children) {
        //      d._children = d.children;
        //      d._children.forEach(collapse);
        //      d.children = null;
        //  }
        //}

        //function expand(d) {
        //  if (d._children) {
        //      d.children = d._children;
        //      d.children.forEach(expand);
        //      d._children = null;
        //  }
        //}

        overCircle = function (d) {
            var tempArray = [];

            selectedNode = null;

            if (draggingNode) {
                moduleName = draggingNode.name;
                if (moduleName !== 'SYSTICK') {
                    if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
                        selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                    }
                    else {
                        selectField = moduleName + s_S;
                    }

                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                        tempArray = NUTOOL_CLOCK.g_CLKSEL[selectField].slice();
                    }

                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sSTCLK_S)) {
                        tempArray = NUTOOL_CLOCK.g_CLKSEL[sSTCLK_S].slice();
                    }
                    else {
                        tempArray.push(NUTOOL_CLOCK.g_Module[moduleName][0]);
                    }
                }

                if (tempArray.length > 0) {
                    for (i = 0, max = tempArray.length; i < max; i += 1) {
                        fullFieldName = tempArray[i].slicePriorToX(':').slicePriorToX('/').toString();

                        if (d.name === fullFieldName) {
                            selectedNode = d;

                            break;
                        }
                        else if (i === max - 1) {
                            if (!g_bReadyForRelease && window.console) { window.console.log(moduleName + " cannot be " + d.name + "'s children."); }
                        }
                    }
                }
                else if (d.name === selectField) {
                    selectedNode = d;
                }
                else {
                    if (!g_bReadyForRelease && window.console) { window.console.log(moduleName + " cannot be " + d.name + "'s children."); }
                }

                updateTempConnector();
            }
        };
        outCircle = function () {
            selectedNode = null;
            updateTempConnector();
        };

        // Function to update the temporary connector indicating dragging affiliation
        updateTempConnector = function () {
            var data = [],
                link;

            if (draggingNode !== null && selectedNode !== null) {
                // have to flip the source coordinates since we did this for the existing connectors on the original tree
                data = [{
                    source: {
                        x: selectedNode.y0,
                        y: selectedNode.x0
                    },
                    target: {
                        x: draggingNode.y0,
                        y: draggingNode.x0
                    }
                }];
            }

            link = g_svgGroup.selectAll(".templink").data(data);
            link.enter().append("path")
                .attr("class", "templink")
                .attr("d", d3.svg.diagonal())
                .attr('pointer-events', 'none');

            link.attr("d", d3.svg.diagonal());

            link.exit().remove();
        };

        // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
        function centerNode(source) {
            var x,
                y,
                scale = zoomListener.scale();
            x = -source.y0;
            y = -source.x0;
            x = x * scale;// + viewerWidth / 8;
            y = y * scale + viewerHeight * 3 / 4;
            d3.select('g').transition()
                .duration(duration)
                .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
            zoomListener.scale(scale);
            zoomListener.translate([x, y]);
        }

        function zoomFromToolbar(scale) {
            var x,
                y;

            x = -root.y;
            y = -root.x;
            x = x * scale;// + viewerWidth / 8;
            y = y * scale + viewerHeight * 3 / 4;
            d3.select('g').transition()
                .duration(duration)
                .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
            zoomListener.scale(scale);
            zoomListener.translate([x, y]);
        }
        // Toggle children function
        //function toggleChildren(d) {
        //  if (d.children) {
        //      d._children = d.children;
        //      d.children = null;
        //  } else if (d._children) {
        //      d.children = d._children;
        //      d._children = null;
        //  }
        //  return d;
        //}

        function animateParentChain(links) {
            // remove old selected paths
            g_svgGroup.selectAll("path.selected")
                .data([])
                .exit().remove();
            // add new selected paths.
            g_svgGroup.selectAll("path.selected")
                .data(links)
                .enter().append("svg:path")
                .attr("class", "selected")
                .attr("d", diagonal);
        }

        function click(d) {
            var ancestors,
                parent,
                matchedLinks;

            if (!g_bReadyForRelease && window.console) { window.console.log("In click, " + d.name + "'s enabled:" + d.enabled + " / bDragStarted:" + bDragStarted); }
            removeAlldialogs();

            if (d.enabled) {
                // since the node might change its clock source, we have to update the node.
                if (d.name === 'RTC' &&
                    typeof NUTOOL_CLOCK.g_Module.CLKO_1Hz !== 'undefined' &&
                    NUTOOL_CLOCK.g_Module.CLKO_1Hz[0].indexOf('RTC') !== -1 &&
                    $.inArray('CLKO_1Hz', enabledModules) !== -1) {
                    // for M451, M460, M480, M0564, NUC126 and NUC200AE
                    uncheck_d3node(d.name, ['CLKO_1Hz']);
                }
                else {
                    uncheck_d3node(d.name);
                }
                check_d3node(d.name, true);
                // Walk parent chain
                ancestors = [];
                parent = d;
                while (!_.isUndefined(parent)) {
                    ancestors.push(parent);
                    parent = parent.parent;
                }
                // Get the matched links
                matchedLinks = [];
                g_svgGroup.selectAll('path.link')
                    .filter(function (d) {
                        return _.any(ancestors, function (p) {
                            return p === d.target;
                        });
                    })
                    .each(function (d) {
                        matchedLinks.push(d);
                    });

                animateParentChain(matchedLinks);
            }
        }

        function dblclick(d) {
            var ancestors,
                parent,
                matchedLinks;

            removeAlldialogs();

            // determined whether double clicking occurred on Node or tab-4
            bDblClikedOnNode = true;

            if ($.inArray(d.name, rootChildren) === -1) {
                //if (d3.event.defaultPrevented) return; // click suppressed
                //d = toggleChildren(d);
                nodeDblclickHandler(d.name, d.enabled);

                //d.enabled = d.enabled ? 0 : 1;

                update(d);
                //centerNode(d);

                if (d.enabled) {
                    // Walk parent chain
                    ancestors = [];
                    parent = d;
                    while (!_.isUndefined(parent)) {
                        ancestors.push(parent);
                        parent = parent.parent;
                    }

                    // Get the matched links
                    matchedLinks = [];
                    g_svgGroup.selectAll('path.link')
                        .filter(function (d) {
                            return _.any(ancestors, function (p) {
                                return p === d.target;
                            });
                        })
                        .each(function (d) {
                            matchedLinks.push(d);
                        });

                    animateParentChain(matchedLinks);
                }
                else {
                    // remove old selected paths
                    g_svgGroup.selectAll("path.selected")
                        .data([])
                        .exit().remove();
                }

                // update tooltip
                tip.hide(d);
                if ($("#tabs").tabs('option', 'active') + 1 == g_finalStep) {
                    tip.show(d);
                }
            }
            else {
                if (d.name.indexOf(sLIRC) === 0 || d.name.indexOf(sHIRC) === 0 || d.name.indexOf(sHIRC2) === 0 || d.name.indexOf('HIRC48') === 0 || d.name.indexOf('MIRC') === 0 || d.name.indexOf(sLXT) === 0 || d.name.indexOf(sHXT) === 0 || d.name.indexOf('RTC32k') === 0) {
                    $("#tabs").tabs({ active: 0 });
                }
                else if (d.name.indexOf('PLL') !== -1) {
                    $("#tabs").tabs({ active: 1 });
                }
                else if (d.name.indexOf(sHCLK) === 0 || d.name.indexOf(sPCLK) === 0 || d.name.indexOf('CPUCLK') === 0) {
                    $("#tabs").tabs({ active: ($("#tabs").tabs('option', 'active') - 1) });
                }
                // update tooltip
                tip.hide(d);
            }
        }

        function checkNodeBeAllowedToEnable(d) {
            if (typeof (d.parent) !== 'undefined') {
                if (checkParentIfEnabled(d.parent)) {
                    return 1;
                }
                else {
                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog("因前面的时脉源是关闭状态，所以" + d.name + " 不能被开启。");
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog("因前面的時脈源是關閉狀態，所以" + d.name + " 不能被開啟。");
                    }
                    else {
                        invokeWarningDialog("Since the preceding clock source is disabled, " + d.name + " cannot be enabled.");
                    }

                    return 0;
                }
            }
        }

        function checkParentIfEnabled(d) {
            var returnValue = 0;
            if (typeof (d.parent) !== 'undefined') {
                returnValue = checkParentIfEnabled(d.parent);
            }
            else {
                return d.enabled;
            }

            if (returnValue) {
                return d.enabled;
            }
            else {
                return 0;
            }
        }

        function searchFromInput(searchNodeName) {
            var searchingNode,
                ancestors,
                parent,
                matchedLinks;

            if (!g_bReadyForRelease && window.console) { window.console.log("In searchFromInput, searchNodeName:" + searchNodeName); }

            d3.selectAll('g.node').each(function (d) {
                if (d.name.toLowerCase() === searchNodeName.toLowerCase()) {
                    searchingNode = d;
                }
            });
            // Walk parent chain
            ancestors = [];
            parent = searchingNode;
            while (!_.isUndefined(parent)) {
                ancestors.push(parent);
                parent = parent.parent;
            }
            // Get the matched links
            matchedLinks = [];
            g_svgGroup.selectAll('path.link')
                .filter(function (d) {
                    return _.any(ancestors, function (p) {
                        return p === d.target;
                    });
                })
                .each(function (d) {
                    matchedLinks.push(d);
                });

            animateParentChain(matchedLinks);
        }

        function updateFromCanvas(draggingNodeName, selectedNodeName, bUpdateTree, oldSelectorOrDividerValue, newSelectorOrDividerValue) {
            var selectedNode1 = {},
                draggingNode1 = {},
                index;

            if (!g_bReadyForRelease && window.console) { window.console.log("In updateFromCanvas, bUpdateTree:" + bUpdateTree); }
            if (typeof bUpdateTree === 'undefined') {
                bUpdateTree = false;
            }

            d3.selectAll('g.node').each(function (d) {
                if (d.name === selectedNodeName) {
                    selectedNode1 = d;
                }
            });

            d3.selectAll('g.node').each(function (d) {
                if (d.name === draggingNodeName) {
                    draggingNode1 = d;
                }
            });
            // remove old selected paths
            g_svgGroup.selectAll("path.selected")
                .data([])
                .exit().remove();

            //nodes = tree.nodes(draggingNode1);
            //if (nodes.length > 1) {
            //  // remove link paths
            //  links = tree.links(nodes);
            //  nodePaths = g_svgGroup.selectAll("path.link")
            //      .data(links, function (d) {
            //          return d.target.id;
            //      }).remove();
            //  // remove child nodes
            //  nodesExit = g_svgGroup.selectAll("g.node")
            //      .data(nodes, function (d) {
            //          return d.id;
            //      }).filter(function (d) {
            //          if (d.id == draggingNode1.id) {
            //              return false;
            //          }
            //          return true;
            //      }).remove();
            //}

            // remove parent link
            g_svgGroup.selectAll('path.link').filter(function (d) {
                if (d.target.id == draggingNode1.id) {
                    return true;
                }
                return false;
            }).remove();
            // now remove the element from the parent, and insert it into the new elements children
            index = draggingNode1.parent.children.indexOf(draggingNode1);
            if (index > -1) {
                draggingNode1.parent.children.splice(index, 1);
            }
            if (typeof selectedNode1.children !== 'undefined' || typeof selectedNode1._children !== 'undefined') {
                if (typeof selectedNode1.children !== 'undefined') {
                    selectedNode1.children.push(draggingNode1);
                } else {
                    selectedNode1._children.push(draggingNode1);
                }
            } else {
                selectedNode1.children = [];
                selectedNode1.children.push(draggingNode1);
            }
            // update the module frequency
            index = $.inArray(draggingNodeName, enabledModules);
            if (index !== -1) {
                // remove old data
                enabledModules.splice(index, 1);
                enabledModuleFrequencies.splice(index, 1);
                // add new data
                enabledModules.push(draggingNodeName);
                draggingNode1.freq = $("#" + draggingNodeName + "_span_showRealFreq").text();
                enabledModuleFrequencies.push(draggingNode1.freq);
            }

            // handle the case of same selector modules
            if (newSelectorOrDividerValue !== oldSelectorOrDividerValue) {
                updateSameSelectorOrDividerModules(draggingNodeName, selectedNodeName);
            }

            if (bUpdateTree) {
                update(root);
            }
        }

        function updateFromDividerDialog(draggingNodeName, bUpdateTree, oldSelectorOrDividerValue) {
            var draggingNode1 = {},
                index;

            if (!g_bReadyForRelease && window.console) { window.console.log("In updateFromDividerDialog, bUpdateTree:" + bUpdateTree); }
            if (typeof bUpdateTree === 'undefined') {
                bUpdateTree = false;
            }

            d3.selectAll('g.node').each(function (d) {
                if (d.name === draggingNodeName) {
                    draggingNode1 = d;
                }
            });
            // update the module frequency
            index = $.inArray(draggingNodeName, enabledModules);
            if (index !== -1) {
                // remove old data
                enabledModules.splice(index, 1);
                enabledModuleFrequencies.splice(index, 1);
                // add new data
                enabledModules.push(draggingNodeName);
                draggingNode1.freq = $("#" + draggingNodeName + "_span_showRealFreq").text();
                enabledModuleFrequencies.push(draggingNode1.freq);
            }

            moduleName = draggingNodeName;
            // handle the case of same selector modules
            if (oldSelectorOrDividerValue !== -1 && g_dividerInputValue !== oldSelectorOrDividerValue) {
                updateSameSelectorOrDividerModules(moduleName);
            }
            if (bUpdateTree) {
                update(root);
            }
        }

        function update(source) {
            if (!g_bReadyForRelease && window.console) { window.console.log("In update"); }

            // Compute the new height, function counts total children of root node and sets tree height accordingly.
            // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
            // This makes the layout more consistent.
            //var levelWidth = [1];
            //var childCount = function (level, n) {

            //  if (n.children && n.children.length > 0) {
            //      if (levelWidth.length <= level + 1) levelWidth.push(0);

            //      levelWidth[level + 1] += n.children.length;
            //      n.children.forEach(function (d) {
            //          childCount(level + 1, d);
            //      });
            //  }
            //};
            //childCount(0, root);
            //var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
            //tree = tree.size([newHeight, viewerWidth]);

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes),
                node,
                nodeEnter,
                nodeUpdate,
                nodeExit,
                link;

            // Set widths between levels based on maxLabelLength.
            //window.alert(maxLabelLength)
            nodes.forEach(function (d) {
                d.y = (d.depth * ((maxLabelLength + 3) * 10)); //maxLabelLength * 5px. add the result string. For example, :10.1234MHz.
                // alternatively to keep a fixed scale one can set a fixed depth per level
                // Normalize for fixed-depth by commenting out below line
                // d.y = (d.depth * 500); //500px per level.
            });

            // Update the nodes
            node = g_svgGroup.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id || (d.id = ++i);
                });

            // Enter any new nodes at the parent's previous position.
            nodeEnter = node.enter().append("g")
                .call(dragListener)
                .attr("class", "node")
                .attr("id", function (d) { return d.name; })
                .attr("transform", function () {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
                .on('click', click)
                .on('dblclick', dblclick)
                .on('updateFromCanvas', updateFromCanvas)
                .on('updateFromDividerDialog', updateFromDividerDialog)
                .on('zoomFromToolbar', zoomFromToolbar)
                .on('searchFromInput', searchFromInput)
                .on("mouseover", function (node) {
                    if (!g_bReadyForRelease && window.console) { window.console.log("In mouseover, node.name:" + node.name); }
                    d3.select(this).classed("hover", true);

                    if (node == root || $.inArray(node.name, rootChildren) !== -1) {
                        d3.select(this).classed("notDraggable", true);
                    }
                    else {
                        d3.select(this).classed("notDraggable", false);
                    }

                    tip.hide(node);
                    if (($("#tabs").tabs('option', 'active') + 1 == g_finalStep) && !dragOngoing && node !== root) {
                        tip.show(node);
                    }

                })
                .on("mouseout", function (node) {
                    if (!g_bReadyForRelease && window.console) { window.console.log("In mouseout, node.name:" + node.name); }
                    d3.select(this).classed("hover", false);

                    tip.hide(node);
                });

            nodeEnter.append("circle")
                .attr('class', 'nodeCircle');

            nodeEnter.append("text")
                .attr("x", function () {
                    return 10;//d.children || d._children ? -10 : 10;
                })
                .attr("dy", ".35em")
                .attr('class', 'nodeText')
                .attr("text-anchor", function () {
                    return "start";//d.children || d._children ? "end" : "start";
                })
                .text(function (d) {
                    return (d.enabled && d.freq !== -1) ? d.name + ':' + d.freq : d.name;//d.name;
                })
                .style("fill-opacity", 0);

            // phantom node to give us mouseover in a radius around it
            nodeEnter.append("circle")
                .attr('class', 'ghostCircle')
                .attr("r", 30)
                .attr("opacity", 0.2) // change this to zero to hide the target area
                .style("fill", "lightyellow")
                .attr('pointer-events', 'mouseover')
                .on("mouseover", function (node) {
                    overCircle(node);
                })
                .on("mouseout", function (node) {
                    outCircle(node);
                });

            // Update the text to reflect whether node has children or not.
            node.select('text')
                .attr("x", function () {
                    return 10;//d.children || d._children ? -10 : 10;
                })
                .attr("text-anchor", function () {
                    return "start";//d.children || d._children ? "end" : "start";
                })
                .attr("font-weight", function (d) {
                    return d.children || d._children ? "bold" : "normal";
                })
                .text(function (d) {
                    return (d.enabled && d.freq !== -1) ? d.name + ':' + d.freq : d.name;
                });

            // Change the circle fill depending on whether it has been enabled.
            node.select("circle.nodeCircle")
                .attr("r", 4.5)
                .style("fill", function (d) {
                    return d.enabled ? "#41AF88" : "#fff";
                });

            // Transition nodes to their new position.
            nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

            // Fade the text in
            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function () {
                    return "translate(" + source.y + "," + source.x + ")";
                })
                .remove();

            nodeExit.select("circle")
                .attr("r", 0);

            nodeExit.select("text")
                .style("fill-opacity", 0);

            // Update the links
            link = g_svgGroup.selectAll("path.link")
                .data(links, function (d) {
                    return d.target.id;
                });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .style("stroke", function () { return 'LightSteelBlue'; })
                .attr("d", function () {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    };
                    return diagonal({
                        source: o,
                        target: o
                    });
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function () {
                    var o = {
                        x: source.x,
                        y: source.y
                    };
                    return diagonal({
                        source: o,
                        target: o
                    });
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        // Append a group which holds all nodes and which the zoom Listener can act upon.
        g_svgGroup = baseSvg.append("g").attr("id", "g_svgGroup");

        // Define the root
        root = treeData;
        root.x0 = viewerHeight / 2;
        root.y0 = viewerWidth / 2;

        // Layout the tree initially and center on the root node.
        update(root);
        centerNode(root);
    }

    function createModuleCanvas(hostDivString, moduleName, defaultValue, selectField, dividerField) {
        var i,
            max,
            j,
            maxJ,
            appendElementString,
            selectRegContent = [],
            selectRegister = "",
            allowedInput = [],
            dividerUpperLimit = 0,
            clockRegName,
            fullFieldName,
            fullFieldName1,
            selectFieldNameExtended,
            selectFieldNameExtendedShiftBit,
            mask,
            inputSource,
            inputSource1,
            bCalledByInitializeModule = true,
            $moduleName_canvas,
            line,
            context,
            canvas_startPointX = 20,
            canvas_startPointY = 20,
            x,
            y,
            offsetY = 20,
            arrowLineLength = 0,
            arrowConstantLineLength = 45,
            trapezoidHeight = 30,
            fillTextArray = [],
            fillColorArray = [],
            dividerPartLength,
            canvasWidth = 0,
            canvasHeight = 0,
            rect,
            mousePositionX,
            mousePositionY,
            moduleSourceInformationArray = [],
            bRefreshCanvas,
            dividerFieldInformation,
            content,
            title,
            okButton,
            colorForConfiguredByDiagram = '#C62A39',
            colorForFocusedByMouse = '#DF630E',
            colorForDisallowed = '#BC8484',
            moduleRealFrequency,
            selectFieldName,
            selectFieldValue,
            oldSelectorOrDividerValue,
            newSelectorOrDividerValue,
            newSelectorOrDividerValue1,
            newSelectorOrDividerValue2,
            drawModuleDiagram,
            initializeModule,
            getMousePos,
            moduleDiagramMouseMoveHandler,
            moduleDiagramClickHandler,
            generateRealModuleFrequency,
            invokeDividerSettingDialog,
            sSTCLK_S = 'STCLK_S'.toEquivalent().toString(),
            sSYST_CSR = 'SYST_CSR'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sLXT = 'LXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString();

        drawModuleDiagram = function () {
            context = g_utility.getContext($moduleName_canvas[0]);
            context.font = '18px Arial';
            context.fillStyle = 'black';
            x = canvas_startPointX;
            // decide the size of the canvas
            // decide arrowLineLength
            arrowLineLength = 0;
            fillTextArray = [];
            fillColorArray = [];
            for (i = 0, max = allowedInput.length; i < max; i += 1) {
                fillTextArray.push(allowedInput[i] + ': ' + decideInputClockFreq(allowedInput[i]).toHzString());
                if (context.measureText(fillTextArray[fillTextArray.length - 1]).width > arrowLineLength) {
                    arrowLineLength = context.measureText(fillTextArray[fillTextArray.length - 1]).width;
                }

                if ($.inArray(allowedInput[i].slicePriorToX('/').toString(), g_enabledBaseClocks) !== -1 ||
                    allowedInput[i] === 'CPUCLK') {
                    fillColorArray[i] = 'black';
                }
                else {
                    fillColorArray[i] = colorForDisallowed;
                }
            }
            arrowLineLength += 30; // add the width of arrowhead

            if (allowedInput.length > 1) {
                if (dividerField === 'none') {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + (18 + 4) * (allowedInput.length - 1) + offsetY * 2;
                }
                else {
                    // decide dividerPartLength
                    dividerPartLength = arrowConstantLineLength + context.measureText('1/(' + dividerField + ': 0 + 1)').width;
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + (18 + 4) * (allowedInput.length - 1) + offsetY * 2;
                }
            }
            else {
                if (dividerField === 'none') {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + offsetY * 2;
                }
                else {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText('1/(' + dividerField + ': 0 + 1)').width + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + offsetY * 2;
                }
            }

            $moduleName_canvas[0].setAttribute('width', canvasWidth);
            $moduleName_canvas[0].setAttribute('height', canvasHeight);
            context.font = '18px Arial';
            context.fillStyle = 'black';
            // start to draw
            x = canvas_startPointX;
            moduleSourceInformationArray = [];
            dividerFieldInformation = {};
            dividerFieldInformation.name = '';
            if (allowedInput.length > 1) {
                // draw the candidates of input sources
                for (i = 0, max = allowedInput.length; i < max; i += 1) {
                    y = canvas_startPointY + (18 + 4) * i + offsetY;
                    context.fillStyle = fillColorArray[i];
                    context.fillText(fillTextArray[i], x, y);
                    line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                    line.drawWithArrowheads(context);
                    // stash the source information
                    moduleSourceInformationArray.push({
                        name: fillTextArray[i],
                        x: x,
                        y: y,
                        textLength: context.measureText(fillTextArray[i]).width,
                        color: fillColorArray[i],
                        lastColor: fillColorArray[i]
                    });
                }
                // draw trapezoid
                context.beginPath();
                context.moveTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY + (18 + 4) * (allowedInput.length - 1) + 2 * offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + (18 + 4) * (allowedInput.length - 1) + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.stroke();
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== 'none') {
                    line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight,
                        canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY,
                        canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength,
                        canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY);
                    line.drawWithArrowheads(context);
                    dividerPartLength += arrowConstantLineLength;

                    x = canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength;
                    y = canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY + 18 / 2 - 2;
                    context.fillText('1/(' + dividerField + ': 0 + 1)', x, y);
                    dividerPartLength += context.measureText('1/(' + dividerField + ': 0 + 1)').width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/(' + dividerField + ': 0 + 1)',
                        x: x,
                        y: y,
                        textLength: context.measureText('1/(' + dividerField + ': 0 + 1)').width,
                        color: 'black',
                        lastColor: 'black'
                    };
                }
                // draw the final part of the module name
                line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY);
                line.drawWithArrowheads(context);
                context.fillText(moduleName,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY + 18 / 2 - 2);
            }
            else {
                y = canvas_startPointY + offsetY;
                context.fillText(fillTextArray[0], x, y);
                line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                line.drawWithArrowheads(context);
                // stash the source information
                moduleSourceInformationArray.push({
                    name: fillTextArray[0],
                    x: x,
                    y: y,
                    textLength: context.measureText(fillTextArray[0]).width,
                    color: fillColorArray[0],
                    lastColor: fillColorArray[0]
                });
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== 'none') {
                    x = canvas_startPointX + arrowLineLength;
                    context.fillText('1/(' + dividerField + ': 0 + 1)', x, y + 18 / 2 - 2);
                    dividerPartLength += context.measureText('1/(' + dividerField + ': 0 + 1)').width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/(' + dividerField + ': 0 + 1)',
                        x: x,
                        y: (y + 18 / 2 - 2),
                        textLength: context.measureText('1/(' + dividerField + ': 0 + 1)').width,
                        color: 'black',
                        lastColor: 'black'
                    };
                    // draw the final part of the module name
                    line = new Line(canvas_startPointX + arrowLineLength + dividerPartLength,
                        y,
                        canvas_startPointX + arrowLineLength + dividerPartLength + arrowConstantLineLength,
                        y);
                    line.drawWithArrowheads(context);
                    context.fillText(moduleName,
                        canvas_startPointX + arrowLineLength + dividerPartLength + arrowConstantLineLength,
                        y + 18 / 2 - 2);
                }
                else {
                    context.fillText(moduleName,
                        canvas_startPointX + arrowLineLength,
                        y + 18 / 2 - 2);
                }
            }
            // build the span of the real output frequency
            appendElementString = "<div id='" + moduleName + "_div_protection'></div>";
            $("#" + hostDivString).append(appendElementString);
            appendElementString = "<div id='" + moduleName + "_div_showRealFreq'><p class = 'div_clock_composite'><span class=realOutput_before_span>The clock of </span>" + moduleName + "<span class=realOutput_after_span>: </span><span id='" + moduleName + "_span_showRealFreq'></span></p></div>";
            $("#" + hostDivString).append(appendElementString);
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                $(".realOutput_before_span").text('模块');
                $(".realOutput_after_span").text('的时脉频率: ');
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                $(".realOutput_before_span").text('模組');
                $(".realOutput_after_span").text('的時脈頻率: ');
            }
            else {
                $(".realOutput_before_span").text('The clock of ');
                $(".realOutput_after_span").text(': ');
            }

            $("#" + moduleName + "_div_protection")[0].setAttribute('style', 'background-color:#FFFFFF; position:absolute; left:0px; top:' + (50) + 'px; width:' + (30 + canvasWidth * 4 / 3 + 2) + 'px;height:' + (20 + canvasHeight + 60) + 'px;');
            $("#" + moduleName + "_div_showRealFreq")[0].setAttribute('style', 'background-color: #FFFFFF; position:absolute; left:30px; top:' + (70 + canvasHeight + 10 + 10) + 'px;');
            $("#" + moduleName + "_span_showRealFreq").css('color', '#2E2EFE');

            // based on the value of clock registers to generate the diagram
            initializeModule();
        };
        getMousePos = function (canvas, evt) {
            rect = canvas.getBoundingClientRect();
            // return relative mouse position
            mousePositionX = evt.clientX - rect.left;
            mousePositionY = evt.clientY - rect.top;

            return this;
        };
        moduleDiagramMouseMoveHandler = function () {
            // moduleSourceInformationArray part
            bRefreshCanvas = false;
            for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                    mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                    if (moduleSourceInformationArray[i].color !== colorForFocusedByMouse) {
                        moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color;
                        moduleSourceInformationArray[i].color = colorForFocusedByMouse;
                        bRefreshCanvas = true;
                    }
                }
                else {
                    if (moduleSourceInformationArray[i].color !== moduleSourceInformationArray[i].lastColor) {
                        moduleSourceInformationArray[i].color = moduleSourceInformationArray[i].lastColor;
                        bRefreshCanvas = true;
                    }
                }
            }
            if (bRefreshCanvas) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    // clear text
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                    // draw the candidates of input sources
                    context.fillStyle = moduleSourceInformationArray[i].color;
                    context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                }
            }
            // dividerFieldInformation part
            bRefreshCanvas = false;
            if (dividerFieldInformation.name) {
                if (mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                    mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) {
                    if (dividerFieldInformation.color !== colorForFocusedByMouse) {
                        dividerFieldInformation.lastColor = dividerFieldInformation.color;
                        dividerFieldInformation.color = colorForFocusedByMouse;
                        bRefreshCanvas = true;
                    }
                }
                else {
                    if (dividerFieldInformation.color !== dividerFieldInformation.lastColor) {
                        dividerFieldInformation.color = dividerFieldInformation.lastColor;
                        bRefreshCanvas = true;
                    }
                }
            }
            if (bRefreshCanvas) {
                // clear text
                context.fillStyle = '#FFFFFF';
                context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                // draw the candidates of input sources
                context.fillStyle = dividerFieldInformation.color;
                context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
            }
        };
        generateRealModuleFrequency = function () {
            var i,
                max;
            moduleRealFrequency = 0;
            // moduleSourceInformationArray part
            for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                if (moduleSourceInformationArray[i].color === colorForConfiguredByDiagram) {
                    fullFieldName = moduleSourceInformationArray[i].name;
                    if (fullFieldName.indexOf('MHz') !== -1) {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':').sliceAfterX(':'), fullFieldName.length - 3) * 1000000;
                    }
                    else if (fullFieldName.indexOf('kHz') !== -1) {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':').sliceAfterX(':'), fullFieldName.length - 3) * 1000;
                    }
                    else {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':').sliceAfterX(':'), fullFieldName.length - 2);
                    }
                    break;
                }

                if (i === max - 1) {
                    //window.alert('not yet')
                    return this;
                }
            }
            // dividerFieldInformation part
            if (dividerFieldInformation.name) {
                if (dividerFieldInformation.color === colorForConfiguredByDiagram) {
                    moduleRealFrequency = moduleRealFrequency / (readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]) + 1);
                }
                else {
                    //window.alert('not yet')
                    return this;
                }
            }
            // update the real output frequency
            moduleRealFrequency = updateModuleRealFrequency(moduleName, moduleRealFrequency);
            $("#" + moduleName + "_span_showRealFreq").text(moduleRealFrequency.toHzString());

            if (!g_bReadyForRelease && window.console) { window.console.log("In createModuleCanvas, " + moduleName + "'s clock:" + moduleRealFrequency.toHzString()); }
            return this;
        };
        invokeDividerSettingDialog = function (dividerField) {
            var i,
                max,
                j,
                maxJ,
                bClockSourceWithDIV = false;

            // close the last dialog
            if ($('#dividerConfigureDialog').is(':visible')) {
                $('#dividerConfigureDialog').dialog("destroy");
            }
            // determine dividerUpperLimit
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(dividerField) !== -1 && fullFieldName.indexOf(':') === dividerField.length) {
                        if (fullFieldName.indexOf('-') !== -1) {
                            dividerUpperLimit = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - parseInt(fullFieldName.sliceAfterX('-'), 10) + 1;
                        }
                        else {
                            dividerUpperLimit = parseInt(fullFieldName.sliceAfterX(':'), 10);
                        }

                        dividerUpperLimit = Math.pow(2, dividerUpperLimit) - 1;
                        break;
                    }
                }
            }
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                content = '请设置值给除频器' + dividerField + '。合理的范围从0到' + dividerUpperLimit + '。';
                title = '设置值给除频器';
                okButton = '确认';
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                content = '請設置值給除頻器' + dividerField + '。合理的範圍從0到' + dividerUpperLimit + '。';
                title = '設置值給除頻器';
                okButton = '確認';
            }
            else {
                content = 'Please configure a value to ' + dividerField + '. The feasible range is from 0 to ' + dividerUpperLimit + '.';
                title = 'Configure a value to the divider';
                okButton = 'Confirm';
            }

            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            $('<div id="dividerConfigureDialog"><p>' + content + '</p><p class = "div_clock_composite">' + dividerField + ': </p><input id="' + dividerField + '_input_dialog" type="text" value="0" class = "div_clock_composite"/><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                .dialog({
                    modal: false,
                    resizable: false,
                    title: title,
                    width: 500,
                    height: 'auto',
                    show: 'fade',
                    hide: 'fade',
                    buttons: [
                        {
                            text: okButton,
                            click: function () {
                                g_dividerInputValue = parseInt($("#" + dividerField + "_input_dialog").val(), 10);
                                bClockSourceWithDIV = false;
                                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                                    if (moduleSourceInformationArray[i].name.indexOf(dividerField) !== -1) {
                                        bClockSourceWithDIV = true;
                                        break;
                                    }
                                }

                                if (!bClockSourceWithDIV) {
                                    dividerFieldInformation.name = '1/(' + dividerField + ': ' + g_dividerInputValue + ' + 1)';
                                    // clear text
                                    context.fillStyle = '#FFFFFF';
                                    dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                                    context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                                    // draw the candidates of input sources
                                    context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                                    dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                                    context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                                    oldSelectorOrDividerValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);
                                }
                                else {
                                    for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                                        fullFieldName = moduleSourceInformationArray[i].name;
                                        if (fullFieldName.indexOf(dividerField) !== -1) {
                                            moduleSourceInformationArray[i].name = fullFieldName.slicePriorToX(':') + ":" + g_dividerInputValue + "+1):" + (decideInputClockFreq(fullFieldName.slicePriorToX('/')) / (g_dividerInputValue + 1)).toHzString();
                                            // clear text
                                            context.fillStyle = '#FFFFFF';
                                            moduleSourceInformationArray[i].textLength = context.measureText(fullFieldName).width;
                                            context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength, 20);
                                            // draw the candidates of input sources
                                            context.fillStyle = moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = colorForConfiguredByDiagram;
                                            context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                                            break;
                                        }
                                    }

                                    oldSelectorOrDividerValue = -1;
                                }

                                writeNewValueToClockRegs(dividerField, g_dividerInputValue);
                                generateRealModuleFrequency();

                                g_svgGroup.selectAll("g.node").on("updateFromDividerDialog")(moduleName, true, oldSelectorOrDividerValue);

                                if ($(this).is(':visible')) {
                                    $(this).dialog("destroy");
                                }
                            }
                        }
                    ],
                    close: function () {
                        $(this).dialog("destroy");
                    }
                });

            $("#" + dividerField + "_input_dialog").val(readValueFromClockRegs(dividerField)).width(35);

            $("#" + dividerField + "_input_dialog").width(35).change(function () {
                if (typeof (this.value) === 'undefined' || this.value === '' || this.value.length > 4 || !(/^\d+$/.test(this.value)) || parseInt(this.value, 10) > dividerUpperLimit || parseInt(this.value, 10) < 0) {
                    if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                        $("#" + dividerField + "_input_dialog").val(readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2])).width(35);
                    }
                    else {
                        $("#" + dividerField + "_input_dialog").val('0');
                    }

                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                    }
                    else {
                        invokeWarningDialog('The inputted content is incorrect. Please try again.');
                    }
                }
            });
        };
        initializeModule = function () {
            if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                g_dividerInputValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);
                dividerFieldInformation.name = '1/(' + dividerField + ': ' + g_dividerInputValue + ' + 1)';//'1/(' + g_dividerInputValue + ' + 1)';
                // clear text
                context.fillStyle = '#FFFFFF';
                dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                // draw the candidates of input sources
                context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
            }
            // decide selectFieldName
            selectFieldName = "";
            if (moduleName !== 'SYSTICK') {
                fullFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
                if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(fullFieldName)) {
                    selectFieldValue = readValueFromClockRegs(fullFieldName);
                }
                else {
                    selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[fullFieldName][0];
                    selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                    selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                    selectFieldValue = readValueFromClockRegs(fullFieldName) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;
                }
                if (selectFieldValue !== -1 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                    for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                        if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue.toString()) {
                            selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                            break;
                        }
                    }
                }
            }
            else {
                if (isFieldBe1('CLKSRC')) {
                    selectFieldName = 'CPUCLK';
                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sSTCLK_S)) {
                        fullFieldName = sSTCLK_S;
                        selectFieldValue = readValueFromClockRegs(fullFieldName).toString();
                        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                            for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                                if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue) {
                                    selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        selectFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
                    }
                }
            }
            // decide pressedI
            selectFieldValue = moduleSourceInformationArray.length; // used as pressedI
            if (selectFieldName !== "") {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    fullFieldName = moduleSourceInformationArray[i].name;
                    // remove some characters from DIV source
                    if (fullFieldName.indexOf('DIV') !== -1 && fullFieldName.indexOf(':') !== -1) {
                        fullFieldName1 = fullFieldName;
                        fullFieldName = fullFieldName1.slicePriorToX(':') + '+' + fullFieldName1.sliceAfterX('+');
                    }
                    if (fullFieldName.indexOf(selectFieldName) !== -1 &&
                        fullFieldName.indexOf(':') === selectFieldName.length &&
                        moduleSourceInformationArray[i].color !== colorForDisallowed) {
                        selectFieldValue = i;
                        break;
                    }
                }
            }

            moduleDiagramClickHandler(selectFieldValue);
            bCalledByInitializeModule = false;
        };
        moduleDiagramClickHandler = function (pressedI) {
            var bClockSourceWithDIVClicked = false;
            if (g_clickIndexByTest !== -1 && g_clickIndexByTest !== 100) {
                pressedI = g_clickIndexByTest;
            }

            //window.alert(mousePositionX + '/' + mousePositionY)
            if (typeof (pressedI) === 'undefined') {
                pressedI = -1;
            }
            // moduleSourceInformationArray part
            if (pressedI === -1) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                        mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                        pressedI = i;
                        if (moduleSourceInformationArray[i].name.indexOf('DIV:') !== -1) {
                            bClockSourceWithDIVClicked = true;
                        }
                    }
                }
            }

            // When the default clock source is disabled, assign one feasible source to it.
            if (pressedI === moduleSourceInformationArray.length) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                        pressedI = i;
                        break;
                    }
                }
            }

            oldSelectorOrDividerValue = newSelectorOrDividerValue = -1;
            if (pressedI !== -1) {
                if (moduleSourceInformationArray[pressedI].name.indexOf('Disabled') === -1) {
                    for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                        if (i === pressedI) {
                            moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = colorForConfiguredByDiagram;
                            inputSource = moduleSourceInformationArray[i].name.slicePriorToLastX(':');
                            // remove some characters from DIV source
                            if (inputSource.indexOf('DIV') !== -1 && inputSource.indexOf(':') !== -1) {
                                inputSource1 = inputSource;
                                inputSource = inputSource1.slicePriorToX(':') + '+' + inputSource1.sliceAfterX('+');
                            }

                            // update selectField
                            if (moduleName !== 'SYSTICK') {
                                selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                                    for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                        fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                        if (fullFieldName.indexOf(inputSource) !== -1 && fullFieldName.indexOf(':') === inputSource.length) {
                                            if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectField)) {
                                                oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                                                newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                                writeNewValueToClockRegs(selectField, newSelectorOrDividerValue);
                                            }
                                            else {
                                                selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectField][0];
                                                selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                                                selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                                                oldSelectorOrDividerValue = readValueFromClockRegs(selectField) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;

                                                newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                                mask = Math.pow(2, selectFieldNameExtendedShiftBit) - 1;
                                                newSelectorOrDividerValue1 = newSelectorOrDividerValue & mask;
                                                newSelectorOrDividerValue2 = ((newSelectorOrDividerValue - newSelectorOrDividerValue1) >> selectFieldNameExtendedShiftBit) >>> 0;

                                                writeNewValueToClockRegs(selectField, newSelectorOrDividerValue1);
                                                writeNewValueToClockRegs(selectFieldNameExtended, newSelectorOrDividerValue2);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            else {  // for SYSTICK module
                                if (inputSource.indexOf('CPUCLK') !== -1) {
                                    writeNewValueToClockRegs('CLKSRC', 1, sSYST_CSR);
                                }
                                else {
                                    writeNewValueToClockRegs('CLKSRC', 0, sSYST_CSR);
                                    selectField = sSTCLK_S;
                                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                                        for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                            fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                            if (fullFieldName.indexOf(inputSource) !== -1 && fullFieldName.indexOf(':') === inputSource.length) {
                                                writeNewValueToClockRegs(selectField, parseInt(fullFieldName.sliceAfterX(':'), 10), '', false);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            generateRealModuleFrequency();

                            if (!bCalledByInitializeModule) {
                                g_svgGroup.selectAll("g.node").on("updateFromCanvas")(moduleName, inputSource.slicePriorToX('/').toString(), true, oldSelectorOrDividerValue, newSelectorOrDividerValue);
                            }
                            if (bClockSourceWithDIVClicked) {
                                selectFieldName = moduleSourceInformationArray[i].name;
                                selectFieldValue = selectFieldName.sliceAfterX('(');
                                selectFieldValue = selectFieldValue.slicePriorToX(':');

                                invokeDividerSettingDialog(selectFieldValue);
                            }
                        }
                        else if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                            moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = 'black';
                        }
                        // clear text
                        context.fillStyle = '#FFFFFF';
                        context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                        // draw the candidates of input sources
                        context.fillStyle = moduleSourceInformationArray[i].color;
                        context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                    }
                }
            }
            // dividerFieldInformation part
            if (dividerFieldInformation.name) {
                if ((mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                    mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) ||
                    g_clickIndexByTest === 100) {
                    // update the content of dividerField
                    invokeDividerSettingDialog(dividerField);
                }
            }
        };
        appendElementString = "<div id='" + moduleName + "_div'></div>";
        $("#" + hostDivString).append(appendElementString);

        // build the canvas part
        // decide allowedInput
        allowedInput = [];
        if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
            selectRegister = NUTOOL_CLOCK.g_Module[moduleName][0];
        }
        else {
            selectRegister = selectField;
        }

        if (selectRegister.indexOf('DIV+') !== -1) {
            selectFieldName = selectRegister;
            selectFieldValue = selectFieldName.sliceAfterX('(');
            selectFieldValue = selectFieldValue.slicePriorToX('+');
            selectRegister = selectFieldName.slicePriorToX('+') + ':' + readValueFromClockRegs(selectFieldValue) + '+1)';
            allowedInput.push(selectRegister);
        }
        else if (selectRegister.indexOf(sHCLK) === 0 || selectRegister.indexOf('RTC32k') === 0 ||
            selectRegister.indexOf(sLIRC) === 0 ||
            selectRegister.indexOf(sHIRC) === 0 || selectRegister.indexOf(sHIRC2) === 0 ||
            selectRegister.indexOf('MIRC') === 0 || selectRegister.indexOf(sLXT) === 0 || selectRegister.indexOf(sHXT) === 0 ||
            selectRegister.indexOf(sPLL) === 0 || selectRegister.indexOf('PLL2') === 0 ||
            selectRegister.indexOf('PLL480M') === 0 || selectRegister.indexOf('APLL') === 0 || selectRegister.indexOf('PLLFN') === 0 || selectRegister.indexOf('HSUSB_OTG_PHY') === 0 ||
            selectRegister.indexOf(sPCLK) === 0 || selectRegister.indexOf('PCLK0') === 0 || selectRegister.indexOf('PCLK1') === 0 || selectRegister.indexOf('PCLK2') === 0) {
            allowedInput.push(selectRegister);
        }
        else if (selectRegister === 'HCLK_S'.toEquivalent()) {
            allowedInput.push(sHCLK);
        }
        else if (selectRegister === 'PCLK_S'.toEquivalent()) {
            allowedInput.push(sPCLK);
        }
        else if (selectRegister.indexOf('STCLK_S/SYST_CSR[2]'.toEquivalent()) === 0) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL[sSTCLK_S];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                allowedInput.push(selectRegContent[i].slicePriorToX(':'));
            }
        }
        else if (selectRegister.indexOf('CLKSRC/STCKSEL'.toEquivalent()) === 0) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL['STCKSEL'];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                allowedInput.push(selectRegContent[i].slicePriorToX(':'));
            }
        }
        else if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectRegister)) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL[selectRegister];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                selectFieldName = selectRegContent[i];
                if (selectFieldName.indexOf('DIV+') !== -1) {
                    selectFieldValue = selectFieldName.sliceAfterX('(');
                    selectFieldValue = selectFieldValue.slicePriorToX('+');
                    selectRegister = selectFieldName.slicePriorToX('+') + ':' + readValueFromClockRegs(selectFieldValue) + '+1)';
                    allowedInput.push(selectRegister);
                }
                else {
                    allowedInput.push(selectFieldName.slicePriorToX(':'));
                }
            }
        }

        $('#' + hostDivString)[0].appendChild(ce("canvas", moduleName + "_canvas"));
        $moduleName_canvas = $("#" + moduleName + "_canvas");
        $moduleName_canvas[0].setAttribute('style', 'z-index:1; position:absolute; background-color: #FFFFFF; left:30px; top:70px; border: 1px solid black;');
        g_utility.addEvent($moduleName_canvas[0], "mousemove", function (evt) { getMousePos($moduleName_canvas[0], evt); moduleDiagramMouseMoveHandler(); });
        g_utility.addEvent($moduleName_canvas[0], "click", function () { moduleDiagramClickHandler(); });

        drawModuleDiagram();
    }

    function createCLKOCanvas(hostDivString, moduleName, defaultValue, selectField, dividerField) {
        var i,
            max,
            j,
            maxJ,
            appendElementString,
            selectRegContent = [],
            selectRegister = "",
            allowedInput = [],
            dividerUpperLimit = 0,
            clockRegName,
            fullFieldName,
            fullFieldName1,
            inputSource,
            inputSource1,
            bCalledByInitializeModule = true,
            $moduleName_canvas,
            line,
            context,
            canvas_startPointX = 20,
            canvas_startPointY = 20,
            x,
            y,
            offsetY = 20,
            arrowLineLength = 0,
            arrowConstantLineLength = 45,
            trapezoidHeight = 30,
            fillTextArray = [],
            fillColorArray = [],
            dividerPartLength,
            canvasWidth = 0,
            canvasHeight = 0,
            rect,
            mousePositionX,
            mousePositionY,
            moduleSourceInformationArray = [],
            bRefreshCanvas,
            dividerFieldInformation,
            content,
            title,
            okButton,
            colorForConfiguredByDiagram = '#C62A39',
            colorForFocusedByMouse = '#DF630E',
            colorForDisallowed = '#BC8484',
            moduleRealFrequency,
            selectFieldName,
            selectFieldValue,
            oldSelectorOrDividerValue,
            newSelectorOrDividerValue,
            drawModuleDiagram,
            initializeModule,
            getMousePos,
            moduleDiagramMouseMoveHandler,
            moduleDiagramClickHandler,
            generateRealModuleFrequency,
            invokeDividerSettingDialog;

        drawModuleDiagram = function () {
            context = g_utility.getContext($moduleName_canvas[0]);
            context.font = '18px Arial';
            context.fillStyle = 'black';
            x = canvas_startPointX;
            // decide the size of the canvas
            // decide arrowLineLength
            arrowLineLength = 0;
            fillTextArray = [];
            for (i = 0, max = allowedInput.length; i < max; i += 1) {
                fillTextArray.push(allowedInput[i] + ': ' + decideInputClockFreq(allowedInput[i]).toHzString());
                if (context.measureText(fillTextArray[fillTextArray.length - 1]).width > arrowLineLength) {
                    arrowLineLength = context.measureText(fillTextArray[fillTextArray.length - 1]).width;
                }

                if ($.inArray(allowedInput[i].slicePriorToX('/').toString(), g_enabledBaseClocks) !== -1) {
                    fillColorArray[i] = 'black';
                }
                else {
                    fillColorArray[i] = colorForDisallowed;
                }
            }
            arrowLineLength += 30; // add the width of arrowhead

            if (allowedInput.length > 1) {
                if (dividerField === 'none') {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + (18 + 4) * (allowedInput.length - 1) + offsetY * 2;
                }
                else {
                    // decide dividerPartLength
                    dividerPartLength = arrowConstantLineLength + context.measureText('1/2^(' + dividerField + ': 0 + 1)').width;
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + (18 + 4) * (allowedInput.length - 1) + offsetY * 2;
                }
            }
            else {
                if (dividerField === 'none') {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + offsetY * 2;
                }
                else {
                    // decide the size of canvas
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText('1/2^(' + dividerField + ' + 1)').width + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                    canvasHeight = canvas_startPointY * 2 + offsetY * 2;
                }
            }

            $moduleName_canvas[0].setAttribute('width', canvasWidth);
            $moduleName_canvas[0].setAttribute('height', canvasHeight);
            context.font = '18px Arial';
            context.fillStyle = 'black';
            // start to draw
            x = canvas_startPointX;
            moduleSourceInformationArray = [];
            dividerFieldInformation = {};
            dividerFieldInformation.name = '';
            if (allowedInput.length > 1) {
                // draw the candidates of input sources
                for (i = 0, max = allowedInput.length; i < max; i += 1) {
                    y = canvas_startPointY + (18 + 4) * i + offsetY;
                    context.fillStyle = fillColorArray[i];
                    context.fillText(fillTextArray[i], x, y);
                    line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                    line.drawWithArrowheads(context);
                    // stash the source information
                    moduleSourceInformationArray.push({
                        name: fillTextArray[i],
                        x: x,
                        y: y,
                        textLength: context.measureText(fillTextArray[i]).width,
                        color: fillColorArray[i],
                        lastColor: fillColorArray[i]
                    });
                }
                // draw trapezoid
                context.beginPath();
                context.moveTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY + (18 + 4) * (allowedInput.length - 1) + 2 * offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + (18 + 4) * (allowedInput.length - 1) + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.stroke();
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== 'none') {
                    line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight,
                        canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY,
                        canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength,
                        canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY);
                    line.drawWithArrowheads(context);
                    dividerPartLength += arrowConstantLineLength;

                    x = canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength;
                    y = canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY + 18 / 2 - 2;
                    context.fillText('1/2^(' + dividerField + ': 0 + 1)', x, y);
                    dividerPartLength += context.measureText('1/2^(' + dividerField + ': 0 + 1)').width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/2^(' + dividerField + ': 0 + 1)',
                        x: x,
                        y: y,
                        textLength: context.measureText('1/2^(' + dividerField + ': 0 + 1)').width,
                        color: 'black',
                        lastColor: 'black'
                    };
                }
                // draw the final part of the module name
                line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY);
                line.drawWithArrowheads(context);
                context.fillText(moduleName,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (allowedInput.length - 1) / 2 + offsetY + 18 / 2 - 2);
            }
            else {
                y = canvas_startPointY + offsetY;
                context.fillText(fillTextArray[0], x, y);
                line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                line.drawWithArrowheads(context);
                // stash the source information
                moduleSourceInformationArray.push({
                    name: fillTextArray[0],
                    x: x,
                    y: y,
                    textLength: context.measureText(fillTextArray[0]).width,
                    color: fillColorArray[0],
                    lastColor: fillColorArray[0]
                });
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== 'none') {
                    x = canvas_startPointX + arrowLineLength;
                    context.fillText('1/2^(' + dividerField + ': 0 + 1)', x, y + 18 / 2 - 2);
                    dividerPartLength += context.measureText('1/2^(' + dividerField + ': 0 + 1)').width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/2^(' + dividerField + ': 0 + 1)',
                        x: x,
                        y: (y + 18 / 2 - 2),
                        textLength: context.measureText('1/2^(' + dividerField + ': 0 + 1)').width,
                        color: 'black',
                        lastColor: 'black'
                    };
                    // draw the final part of the module name
                    line = new Line(canvas_startPointX + arrowLineLength + dividerPartLength,
                        y,
                        canvas_startPointX + arrowLineLength + dividerPartLength + arrowConstantLineLength,
                        y);
                    line.drawWithArrowheads(context);
                    context.fillText(moduleName,
                        canvas_startPointX + arrowLineLength + dividerPartLength + arrowConstantLineLength,
                        y + 18 / 2 - 2);
                }
                else {
                    context.fillText(moduleName,
                        canvas_startPointX + arrowLineLength,
                        y + 18 / 2 - 2);
                }
            }
            // build the span of the real output frequency
            appendElementString = "<div id='" + moduleName + "_div_protection'></div>";
            $("#" + hostDivString).append(appendElementString);
            appendElementString = "<div id='" + moduleName + "_div_showRealFreq'><p class = 'div_clock_composite'><span class=realOutput_before_span>The clock of </span>" + moduleName + "<span class=realOutput_after_span>: </span><span id='" + moduleName + "_span_showRealFreq'></span></p></div>";
            $("#" + hostDivString).append(appendElementString);
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                $(".realOutput_before_span").text('模块');
                $(".realOutput_after_span").text('的时脉频率: ');
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                $(".realOutput_before_span").text('模組');
                $(".realOutput_after_span").text('的時脈頻率: ');
            }
            else {
                $(".realOutput_before_span").text('The clock of ');
                $(".realOutput_after_span").text(': ');
            }

            $("#" + moduleName + "_div_protection")[0].setAttribute('style', 'background-color:#FFFFFF; position:absolute; left:0px; top:' + (50) + 'px; width:' + (30 + canvasWidth * 4 / 3 + 2) + 'px;height:' + (20 + canvasHeight + 60) + 'px;');
            $("#" + moduleName + "_div_showRealFreq")[0].setAttribute('style', 'background-color: #FFFFFF; position:absolute; top:' + (70 + canvasHeight + 10 + 10) + 'px;');
            $("#" + moduleName + "_span_showRealFreq").css('color', '#2E2EFE');

            // based on the value of clock registers to generate the diagram
            initializeModule();
        };
        getMousePos = function (canvas, evt) {
            rect = canvas.getBoundingClientRect();
            // return relative mouse position
            mousePositionX = evt.clientX - rect.left;
            mousePositionY = evt.clientY - rect.top;

            return this;
        };
        moduleDiagramMouseMoveHandler = function () {
            // moduleSourceInformationArray part
            bRefreshCanvas = false;
            for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                    mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                    if (moduleSourceInformationArray[i].color !== colorForFocusedByMouse) {
                        moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color;
                        moduleSourceInformationArray[i].color = colorForFocusedByMouse;
                        bRefreshCanvas = true;
                    }
                }
                else {
                    if (moduleSourceInformationArray[i].color !== moduleSourceInformationArray[i].lastColor) {
                        moduleSourceInformationArray[i].color = moduleSourceInformationArray[i].lastColor;
                        bRefreshCanvas = true;
                    }
                }
            }
            if (bRefreshCanvas) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    // clear text
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                    // draw the candidates of input sources
                    context.fillStyle = moduleSourceInformationArray[i].color;
                    context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                }
            }
            // dividerFieldInformation part
            bRefreshCanvas = false;
            if (dividerFieldInformation.name) {
                if (mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                    mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) {
                    if (dividerFieldInformation.color !== colorForFocusedByMouse) {
                        dividerFieldInformation.lastColor = dividerFieldInformation.color;
                        dividerFieldInformation.color = colorForFocusedByMouse;
                        bRefreshCanvas = true;
                    }
                }
                else {
                    if (dividerFieldInformation.color !== dividerFieldInformation.lastColor) {
                        dividerFieldInformation.color = dividerFieldInformation.lastColor;
                        bRefreshCanvas = true;
                    }
                }
            }
            if (bRefreshCanvas) {
                // clear text
                context.fillStyle = '#FFFFFF';
                context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                // draw the candidates of input sources
                context.fillStyle = dividerFieldInformation.color;
                context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
            }
        };
        generateRealModuleFrequency = function () {
            var i,
                max;
            moduleRealFrequency = 0;
            // moduleSourceInformationArray part
            for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                if (moduleSourceInformationArray[i].color === colorForConfiguredByDiagram) {
                    fullFieldName = moduleSourceInformationArray[i].name;
                    if (fullFieldName.indexOf('MHz') !== -1) {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 3) * 1000000;
                    }
                    else if (fullFieldName.indexOf('kHz') !== -1) {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 3) * 1000;
                    }
                    else {
                        moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 2);
                    }
                    break;
                }

                if (i === max - 1) {
                    //window.alert('not yet')
                    return this;
                }
            }
            // dividerFieldInformation part
            if (dividerFieldInformation.name) {
                if (dividerFieldInformation.color === colorForConfiguredByDiagram) {
                    moduleRealFrequency = moduleRealFrequency / Math.pow(2, g_dividerInputValue + 1);
                }
                else {
                    //window.alert('not yet')
                    return this;
                }
            }
            // update the real output frequency
            //window.alert(moduleName)
            $("#" + moduleName + "_span_showRealFreq").text(moduleRealFrequency.toHzString());

            if (!g_bReadyForRelease && window.console) { window.console.log("In createCLKOCanvas, " + moduleName + "'s clock:" + moduleRealFrequency.toHzString()); }

            return this;
        };
        invokeDividerSettingDialog = function (dividerField) {
            // close the last dialog
            if ($('#dividerConfigureDialog').is(':visible')) {
                $('#dividerConfigureDialog').dialog("destroy");
            }
            // determine dividerUpperLimit
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(dividerField) !== -1 && fullFieldName.indexOf(':') === dividerField.length) {
                        if (fullFieldName.indexOf('-') !== -1) {
                            dividerUpperLimit = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - parseInt(fullFieldName.sliceAfterX('-'), 10) + 1;
                        }
                        else {
                            dividerUpperLimit = parseInt(fullFieldName.sliceAfterX(':'), 10);
                        }

                        dividerUpperLimit = Math.pow(2, dividerUpperLimit) - 1;
                        break;
                    }
                }
            }
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                content = '请设置值给除频器' + dividerField + '。合理的范围从0到' + dividerUpperLimit + '。';
                title = '设置值给除频器';
                okButton = '确认';
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                content = '請設置值給除頻器' + dividerField + '。合理的範圍從0到' + dividerUpperLimit + '。';
                title = '設置值給除頻器';
                okButton = '確認';
            }
            else {
                content = 'Please configure a value to ' + dividerField + '. The feasible range is from 0 to ' + dividerUpperLimit + '.';
                title = 'Configure a value to the divider';
                okButton = 'Confirm';
            }

            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            $('<div id="dividerConfigureDialog"><p>' + content + '</p><p class = "div_clock_composite">' + dividerField + ': </p><input id="' + dividerField + '_input_dialog" type="text" value="0" class = "div_clock_composite"/><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                .dialog({
                    modal: false,
                    resizable: false,
                    title: title,
                    width: 500,
                    height: 'auto',
                    show: 'fade',
                    hide: 'fade',
                    buttons: [
                        {
                            text: okButton,
                            click: function () {
                                g_dividerInputValue = parseInt($("#" + dividerField + "_input_dialog").val(), 10);
                                dividerFieldInformation.name = '1/2^(' + dividerField + ': ' + g_dividerInputValue + ' + 1)';
                                // clear text
                                context.fillStyle = '#FFFFFF';
                                dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                                context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                                // draw the candidates of input sources
                                context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                                dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                                context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                                oldSelectorOrDividerValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);

                                // update dividerField
                                writeNewValueToClockRegs(dividerField, g_dividerInputValue);
                                generateRealModuleFrequency();

                                g_svgGroup.selectAll("g.node").on("updateFromDividerDialog")(moduleName, true, oldSelectorOrDividerValue);

                                if ($(this).is(':visible')) {
                                    $(this).dialog("destroy");
                                }
                            }
                        }
                    ],
                    close: function () {
                        $(this).dialog("destroy");
                    }
                });

            if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                $("#" + dividerField + "_input_dialog").val(readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2])).width(35);
            }

            $("#" + dividerField + "_input_dialog").width(35).change(function () {
                if (typeof (this.value) === 'undefined' || this.value === '' || this.value.length > 4 || !(/^\d+$/.test(this.value)) || parseInt(this.value, 10) > dividerUpperLimit || parseInt(this.value, 10) < 0) {
                    if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                        $("#" + dividerField + "_input_dialog").val(readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2])).width(35);
                    }
                    else {
                        $("#" + dividerField + "_input_dialog").val('0');
                    }

                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                    }
                    else {
                        invokeWarningDialog('The inputted content is incorrect. Please try again.');
                    }
                }
            });
        };
        initializeModule = function () {
            if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
                g_dividerInputValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);
                dividerFieldInformation.name = '1/2^(' + dividerField + ': ' + g_dividerInputValue + ' + 1)';
                // clear text
                context.fillStyle = '#FFFFFF';
                dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                // draw the candidates of input sources
                context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
            }
            // decide selectFieldName
            selectFieldName = "";
            fullFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
            selectFieldValue = readValueFromClockRegs(fullFieldName).toString();
            if (selectFieldValue !== -1 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                    if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue) {
                        selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                        break;
                    }
                }
            }
            // decide pressedI
            selectFieldValue = moduleSourceInformationArray.length; // used as pressedI
            if (selectFieldName !== "") {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    fullFieldName = moduleSourceInformationArray[i].name;
                    // remove some characters from DIV source
                    if (fullFieldName.indexOf('DIV') !== -1 && fullFieldName.indexOf(':') !== -1) {
                        fullFieldName1 = fullFieldName;
                        fullFieldName = fullFieldName1.slicePriorToX(':') + '+' + fullFieldName1.sliceAfterX('+');
                    }
                    if (fullFieldName.indexOf(selectFieldName) !== -1 &&
                        fullFieldName.indexOf(':') === selectFieldName.length &&
                        moduleSourceInformationArray[i].color !== colorForDisallowed) {
                        selectFieldValue = i;
                        break;
                    }
                }
            }

            moduleDiagramClickHandler(selectFieldValue);
            bCalledByInitializeModule = false;
        };
        moduleDiagramClickHandler = function (pressedI) {
            if (g_clickIndexByTest !== -1 && g_clickIndexByTest !== 100) {
                pressedI = g_clickIndexByTest;
            }

            if (typeof (pressedI) === 'undefined') {
                pressedI = -1;
            }
            // moduleSourceInformationArray part
            if (pressedI === -1) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                        mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                        pressedI = i;
                    }
                }
            }

            // When the default clock source is disabled, assign one feasible source to it.
            if (pressedI === moduleSourceInformationArray.length) {
                for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                    if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                        pressedI = i;
                        break;
                    }
                }
            }

            oldSelectorOrDividerValue = newSelectorOrDividerValue = -1;
            if (pressedI !== -1) {
                if (moduleSourceInformationArray[pressedI].name.indexOf('Disabled') === -1) {
                    for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                        if (i === pressedI) {
                            moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = colorForConfiguredByDiagram;
                            inputSource = moduleSourceInformationArray[i].name.slicePriorToLastX(':');
                            // remove some characters from DIV source
                            if (inputSource.indexOf('DIV') !== -1 && inputSource.indexOf(':') !== -1) {
                                inputSource1 = inputSource;
                                inputSource = inputSource1.slicePriorToX(':') + '+' + inputSource1.sliceAfterX('+');
                            }

                            // update selectField
                            selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
                            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                    fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                    if (fullFieldName.indexOf(inputSource) !== -1 && fullFieldName.indexOf(':') === inputSource.length) {
                                        oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                                        newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                        writeNewValueToClockRegs(selectField, newSelectorOrDividerValue);
                                        break;
                                    }
                                }
                            }

                            generateRealModuleFrequency();

                            if (!bCalledByInitializeModule /*&& g_svgGroup !== null*/) {
                                g_svgGroup.selectAll("g.node").on("updateFromCanvas")(moduleName, inputSource.slicePriorToX('/').toString(), true, oldSelectorOrDividerValue, newSelectorOrDividerValue);
                            }
                        }
                        else if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                            moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = 'black';
                        }
                        // clear text
                        context.fillStyle = '#FFFFFF';
                        context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                        // draw the candidates of input sources
                        context.fillStyle = moduleSourceInformationArray[i].color;
                        context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                    }
                }
            }
            // dividerFieldInformation part
            if (dividerFieldInformation.name) {
                if ((mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                    mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) ||
                    g_clickIndexByTest === 100) {
                    // update the content of dividerField
                    invokeDividerSettingDialog(dividerField);
                }
            }
        };

        appendElementString = "<div id='" + moduleName + "_div'></div>";
        $("#" + hostDivString).append(appendElementString);

        // build the canvas part
        // decide allowedInput
        allowedInput = [];
        if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
            selectRegister = NUTOOL_CLOCK.g_Module[moduleName][0];
        }
        else {
            selectRegister = selectField;
        }

        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectRegister)) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL[selectRegister];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                selectField = selectRegContent[i];
                if (selectField.indexOf('/') === -1) {
                    selectField = selectField.slicePriorToX(':');
                }
                else {
                    selectField = selectField.slicePriorToX('/');
                }
                allowedInput.push(selectRegContent[i].slicePriorToX(':'));
            }
        }
        $('#' + hostDivString)[0].appendChild(ce("canvas", moduleName + "_canvas"));
        $moduleName_canvas = $("#" + moduleName + "_canvas");
        $moduleName_canvas[0].setAttribute('style', 'z-index:1; position:absolute; background-color: #FFFFFF; left:30px; top:70px; border: 1px solid black;');
        g_utility.addEvent($moduleName_canvas[0], "mousemove", function (evt) { getMousePos($moduleName_canvas[0], evt); moduleDiagramMouseMoveHandler(); });
        g_utility.addEvent($moduleName_canvas[0], "click", function () { moduleDiagramClickHandler(); });

        drawModuleDiagram();
    }

    function createModuleOnly(hostDivString, moduleName, defaultValue, selectField) {
        var i,
            max,
            j,
            maxJ,
            allowedInput = [],
            selectRegister,
            selectRegContent = [],
            selectFieldName,
            selectFieldValue,
            fullFieldName,
            appendElementString,
            moduleRealFrequency,
            selectFieldNameExtended,
            selectFieldNameExtendedShiftBit,
            mask,
            oldSelectorOrDividerValue,
            newSelectorOrDividerValue,
            newSelectorOrDividerValue1,
            newSelectorOrDividerValue2,
            sHXT = 'HXT'.toEquivalent().toString(),
            sLXT = 'LXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            bSelectFieldNotFound = false;

        // decide allowedInput
        if (NUTOOL_CLOCK.g_Module.hasOwnProperty(moduleName)) {
            selectRegister = NUTOOL_CLOCK.g_Module[moduleName][0];
        }
        else {
            selectRegister = selectField;
        }

        if (selectRegister.indexOf(sHCLK) === 0 || selectRegister.indexOf('RTC32k') === 0 ||
            selectRegister.indexOf(sLIRC) === 0 ||
            selectRegister.indexOf(sHIRC) === 0 || selectRegister.indexOf(sHIRC2) === 0 ||
            selectRegister.indexOf('MIRC') === 0 || selectRegister.indexOf(sLXT) === 0 || selectRegister.indexOf(sHXT) === 0 ||
            selectRegister.indexOf(sPLL) === 0 || selectRegister.indexOf('PLL2') === 0 ||
            selectRegister.indexOf('PLL480M') === 0 || selectRegister.indexOf('APLL') === 0 || selectRegister.indexOf('PLLFN') === 0 || selectRegister.indexOf('HSUSB_OTG_PHY') === 0 ||
            selectRegister.indexOf('PCLK0') === 0 || selectRegister.indexOf('PCLK1') === 0 || selectRegister.indexOf('PCLK2') === 0) {
            allowedInput.push(selectRegister);
        }
        else if (selectRegister === 'HCLK_S'.toEquivalent()) {
            allowedInput.push(sHCLK);
        }
        else if (selectRegister === 'PCLK_S'.toEquivalent() || selectRegister === sPCLK) {
            allowedInput.push(sPCLK);
        }
        else if (selectRegister.indexOf('STCLK_S/SYST_CSR[2]'.toEquivalent()) === 0) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL['STCLK_S'.toEquivalent()];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                selectField = selectRegContent[i];
                if (selectField.indexOf('/') === -1) {
                    selectField = selectField.slicePriorToX(':');
                }
                else {
                    selectField = selectField.slicePriorToX('/');
                }
                if ($.inArray(selectField, g_enabledBaseClocks) !== -1) {
                    allowedInput.push(selectRegContent[i].slicePriorToX(':'));
                }
            }

        }
        else if (selectRegister.indexOf('CLKSRC/STCKSEL'.toEquivalent()) === 0) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL['STCKSEL'];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                selectField = selectRegContent[i];
                if (selectField.indexOf('/') === -1) {
                    selectField = selectField.slicePriorToX(':');
                }
                else {
                    selectField = selectField.slicePriorToX('/');
                }
                if ($.inArray(selectField, g_enabledBaseClocks) !== -1) {
                    allowedInput.push(selectRegContent[i].slicePriorToX(':'));
                }
            }
        }
        else if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectRegister)) {
            selectRegContent = NUTOOL_CLOCK.g_CLKSEL[selectRegister];
            for (i = 0, max = selectRegContent.length; i < max; i += 1) {
                selectField = selectRegContent[i];
                if (selectField.indexOf('/') === -1) {
                    selectField = selectField.slicePriorToX(':');
                }
                else {
                    selectField = selectField.slicePriorToX('/');
                }
                if ($.inArray(selectField, g_enabledBaseClocks) !== -1) {
                    allowedInput.push(selectRegContent[i].slicePriorToX(':'));
                }
            }
        }

        // decide g_dividerInputValue
        g_dividerInputValue = 0;
        if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
            g_dividerInputValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);
        }
        // read back selectFieldName
        selectFieldName = "";
        if (moduleName !== 'SYSTICK') {
            selectFieldName = fullFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
            if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectFieldName)) {
                selectFieldValue = readValueFromClockRegs(selectFieldName);
            }
            else {
                selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectFieldName][0];
                selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                selectFieldValue = readValueFromClockRegs(selectFieldName) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;
            }
            if (selectFieldValue !== -1 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                    if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue.toString()) {
                        selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                        break;
                    }
                }
            }
        }
        else {  // moduleName == SYSTICK
            if (isFieldBe1('CLKSRC')) {
                selectFieldName = 'CPUCLK';
            }
            else {
                fullFieldName = 'STCLK_S'.toEquivalent().toString();
                selectFieldValue = readValueFromClockRegs(fullFieldName).toString();
                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                    for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                        if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue) {
                            selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                            break;
                        }
                    }
                }
                else {
                    selectFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
                }
            }
        }
        // decide real selectFieldName
        if ($.inArray(selectFieldName, allowedInput) === -1) {
            bSelectFieldNotFound = true;
            selectFieldName = allowedInput[0];
            // update selectField
            selectField = NUTOOL_CLOCK.g_Module[moduleName][0];
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                    if (fullFieldName.indexOf(selectFieldName) !== -1 && fullFieldName.indexOf(':') === selectFieldName.length) {
                        //writeNewValueToClockRegs(selectField, parseInt(fullFieldName.sliceAfterX(':'), 10));
                        if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectField)) {
                            oldSelectorOrDividerValue = readValueFromClockRegs(selectField);
                            newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                            writeNewValueToClockRegs(selectField, newSelectorOrDividerValue);
                        }
                        else {
                            selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectField][0];
                            selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                            selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                            oldSelectorOrDividerValue = readValueFromClockRegs(selectField) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;

                            newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                            mask = Math.pow(2, selectFieldNameExtendedShiftBit) - 1;
                            newSelectorOrDividerValue1 = newSelectorOrDividerValue & mask;
                            newSelectorOrDividerValue2 = ((newSelectorOrDividerValue - newSelectorOrDividerValue1) >> selectFieldNameExtendedShiftBit) >>> 0;

                            writeNewValueToClockRegs(selectField, newSelectorOrDividerValue1);
                            writeNewValueToClockRegs(selectFieldNameExtended, newSelectorOrDividerValue2);
                        }
                        break;
                    }
                }
            }
        }
        // generate the frequency of the module
        if (moduleName === 'CLKO_Divider'.toEquivalent().toString() || moduleName === 'CLKO1_Divider'.toEquivalent().toString()) {
            moduleRealFrequency = decideInputClockFreq(selectFieldName) / Math.pow(2, g_dividerInputValue + 1);
        }
        else {
            moduleRealFrequency = decideInputClockFreq(selectFieldName) / (g_dividerInputValue + 1);
        }
        // build the span of the real output frequency
        if (!$('#' + moduleName + '_div_showRealFreq')[0]) {
            appendElementString = "<div id='" + moduleName + "_div_showRealFreq'><p class = 'div_clock_composite'><span class=realOutput_before_span>The clock of </span>" + moduleName + "<span class=realOutput_after_span>: </span><span id='" + moduleName + "_span_showRealFreq'></span></p></div>";
            $("#" + hostDivString).append(appendElementString);
        }
        // update the real output frequency
        moduleRealFrequency = updateModuleRealFrequency(moduleName, moduleRealFrequency);
        $("#" + moduleName + "_span_showRealFreq").text(moduleRealFrequency.toHzString());
        $("#" + moduleName + "_div_showRealFreq").hide();

        if (!g_bReadyForRelease && window.console) { window.console.log("In createModuleOnly, " + moduleName + "'s clock:" + moduleRealFrequency.toHzString()); }
    }

    function buildModuleTab() {
        var $tabs = $("#tabs");

        removeAlldialogs();
        $("#tabs ul").append("<li id='li-4'><a href='#tab-4'><span id=module_span>Modules</span></a></li>");
        $("#tabs").append("<div id='tab-4'></div>");
        //$("#tabs").css('width', '100%');
        //$("#tabs").css('height', '100%');

        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $("#module_span").text('模块');
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $("#module_span").text('模組');
        }
        else {
            $("#module_span").text('Modules');
        }

        $("#tabs").tabs("refresh");
        $("#tabs").tabs({ active: 3 });
        if ($("#tabs").tabs('option', 'active') !== 3) {
            $("#tabs").tabs({ active: 2 });
        }

        // adjust the size of the relevant UI elements
        if ($('#clockRegsTree').css('display') !== 'none') {
            $tabs.css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            $('#tab-4').css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
        }
        else {
            $tabs.css('width', (g_Dialog_Width - 8) + 'px');
            $('#tab-4').css('width', (g_Dialog_Width - 8) + 'px');
        }
        $tabs.css('height', (g_Dialog_Height - 8) + 'px');
        $('#tab-4').css('height', (g_Dialog_Height - 8) + 'px');

        // build the D3-generated tree
        createD3ClockTree(getPropertyNames(NUTOOL_CLOCK.g_Module));
        $("#tabs")[0].style.visibility = 'visible';

        // make the search input visible
        if ($('#clockRegsTree').css('display') !== 'none') {
            $("#searchModule").show();
        }
    }

    function buildHCLKandPCLKtab(command) {
        var i,
            max,
            j,
            maxJ,
            $tabs = $("#tabs"),
            $tab_3,
            content = "Select one of the following frequencies to be the frequency of HCLK.",
            title,
            okButton,
            appendElementString = "",
            selectField,
            inputSource,
            inputSource1,
            fullFieldName,
            fullFieldName1,
            clockRegName,
            dividerUpperLimit,
            $HCLK_canvas,
            $HCLK_canvas1,
            $PCLK_canvas,
            $PCLK0_canvas,
            $PCLK1_canvas,
            $PCLK2_canvas,
            arrowLineLength,
            fillTextArray = [],
            fillColorArray = [],
            x,
            y,
            canvas_startPointX = 20, // the drawing started from here
            canvas_startPointY = 20,
            inputSourceNumber = 0,
            dividerPartLength,
            line,
            arrowConstantLineLength = 45,
            trapezoidHeight = 30,
            offsetY = 20,
            dividerInputValue,
            allowedInput = [],
            canvasWidth,
            canvasHeight,
            HCLKblockHeight,
            PCLKblockOLeftffset,
            rect,
            mousePositionX,
            mousePositionY,
            colorForConfiguredByDiagram = '#C62A39',
            colorForFocusedByMouse = '#DF630E',
            colorForDisallowed = '#BC8484',
            drawHCLKorPCLKdiagram,
            getMousePos,
            add_tab_3_handler,
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            sHCLK_N = 'HCLK_N'.toEquivalent().toString(),
            sPCLK_N = 'PCLK_N'.toEquivalent().toString(),
            sHCLK_S = 'HCLK_S'.toEquivalent().toString(),
            sPCLK_S = 'PCLK_S'.toEquivalent().toString(),
            sPCLK0SEL = 'PCLK0SEL'.toEquivalent().toString(),
            sPCLK1SEL = 'PCLK1SEL'.toEquivalent().toString(),
            sPCLK2SEL = 'PCLK2SEL'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString();

        drawHCLKorPCLKdiagram = function (canvasElement, moduleName, dividerField, allowedInput, adjacentInput) {
            var context = g_utility.getContext(canvasElement),
                moduleSourceInformationArray = [],
                dividerFieldInformation = {},
                dividerFieldInformationNameEnding,
                bRefreshCanvas,
                moduleRealFrequency,
                selectFieldName,
                selectFieldValue,
                initializeModule = function () {
                    if (dividerField !== '') {
                        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(dividerField)) {
                            dividerFieldInformation.name = '1/(' + dividerField + ': ' + getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL[dividerField], readValueFromClockRegs(dividerField)) + dividerFieldInformation.nameEnding;
                        }
                        else {
                            dividerFieldInformation.name = '1/(' + dividerField + ': ' + readValueFromClockRegs(dividerField) + dividerFieldInformation.nameEnding;
                        }
                        // clear text
                        context.fillStyle = '#FFFFFF';
                        dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                        context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                        // draw the candidates of input sources
                        context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                        dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                        context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                    }
                    // decide selectFieldName
                    selectFieldName = "";
                    if (moduleName === sHCLK) {
                        fullFieldName = sHCLK_S;
                    }
                    else if (moduleName === 'PCLK0') {
                        fullFieldName = sPCLK0SEL;
                    }
                    else if (moduleName === 'PCLK1') {
                        fullFieldName = sPCLK1SEL;
                    }
                    else if (moduleName === 'PCLK2') {
                        fullFieldName = sPCLK2SEL;
                    }
                    else { // PCLK case
                        fullFieldName = sPCLK_S;
                    }
                    selectFieldValue = readValueFromClockRegs(fullFieldName).toString();
                    if (selectFieldValue !== -1 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                        for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                            if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue) {
                                selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                                break;
                            }
                        }
                    }
                    // decide pressedI
                    selectFieldValue = moduleSourceInformationArray.length; // used as pressedI
                    if (selectFieldName !== "") {
                        for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                            fullFieldName = moduleSourceInformationArray[i].name;
                            // remove some characters from DIV source
                            if (fullFieldName.indexOf('DIV') !== -1 && fullFieldName.indexOf(':') !== -1) {
                                fullFieldName1 = fullFieldName;
                                fullFieldName = fullFieldName1.slicePriorToX(':') + '+' + fullFieldName1.sliceAfterX('+');
                            }
                            if (fullFieldName.indexOf(':') !== -1) {
                                if (fullFieldName.indexOf(selectFieldName) !== -1 &&
                                    fullFieldName.indexOf(':') === selectFieldName.length &&
                                    moduleSourceInformationArray[i].color !== colorForDisallowed) {
                                    selectFieldValue = i;
                                    break;
                                }
                            }
                            else {
                                if (fullFieldName.indexOf(selectFieldName) !== -1) {
                                    selectFieldValue = i;
                                    break;
                                }
                            }
                        }
                    }

                    moduleDiagramClickHandler(selectFieldValue);
                },
                moduleDiagramMouseMoveHandler = function () {
                    // moduleSourceInformationArray part
                    bRefreshCanvas = false;
                    for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                        if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                            mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                            if (moduleSourceInformationArray[i].color !== colorForFocusedByMouse) {
                                moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color;
                                moduleSourceInformationArray[i].color = colorForFocusedByMouse;
                                bRefreshCanvas = true;
                            }
                        }
                        else {
                            if (moduleSourceInformationArray[i].color !== moduleSourceInformationArray[i].lastColor) {
                                moduleSourceInformationArray[i].color = moduleSourceInformationArray[i].lastColor;
                                bRefreshCanvas = true;
                            }
                        }
                    }
                    if (bRefreshCanvas) {
                        for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                            // clear text
                            context.fillStyle = '#FFFFFF';
                            context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                            // draw the candidates of input sources
                            context.fillStyle = moduleSourceInformationArray[i].color;
                            context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                        }
                    }
                    // dividerFieldInformation part
                    bRefreshCanvas = false;
                    if (dividerFieldInformation.name) {
                        if (mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                            mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) {
                            if (dividerFieldInformation.color !== colorForFocusedByMouse) {
                                dividerFieldInformation.lastColor = dividerFieldInformation.color;
                                dividerFieldInformation.color = colorForFocusedByMouse;
                                bRefreshCanvas = true;
                            }
                        }
                        else {
                            if (dividerFieldInformation.color !== dividerFieldInformation.lastColor) {
                                dividerFieldInformation.color = dividerFieldInformation.lastColor;
                                bRefreshCanvas = true;
                            }
                        }
                    }
                    if (bRefreshCanvas) {
                        // clear text
                        context.fillStyle = '#FFFFFF';
                        context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                        // draw the candidates of input sources
                        context.fillStyle = dividerFieldInformation.color;
                        context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                    }
                },
                moduleDiagramClickHandler = function (pressedI) {
                    if (g_clickIndexByTest !== -1 && g_clickIndexByTest !== 100) {
                        pressedI = g_clickIndexByTest;
                    }

                    if (typeof (pressedI) === 'undefined') {
                        pressedI = -1;
                    }
                    //window.alert(mousePositionX + '/' + mousePositionY)
                    // moduleSourceInformationArray part
                    if (pressedI === -1) {
                        for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                            if (mousePositionX >= moduleSourceInformationArray[i].x && mousePositionX <= (moduleSourceInformationArray[i].x + moduleSourceInformationArray[i].textLength) &&
                                mousePositionY >= (moduleSourceInformationArray[i].y - 18 - 3) && mousePositionY <= moduleSourceInformationArray[i].y) {
                                pressedI = i;
                            }
                        }
                    }

                    // When the default clock source is disabled, assign one feasible source to it.
                    if (pressedI === moduleSourceInformationArray.length) {
                        for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                            if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                                pressedI = i;
                                break;
                            }
                        }
                    }

                    if (pressedI !== -1) {
                        if (moduleSourceInformationArray[pressedI].name.indexOf('Disabled') === -1) {
                            for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                                if (i === pressedI) {
                                    moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = colorForConfiguredByDiagram;

                                    // update selectField
                                    if (moduleName.indexOf(sHCLK) !== -1) {
                                        selectField = sHCLK_S;
                                        inputSource = moduleSourceInformationArray[i].name.slicePriorToLastX(':');
                                    }
                                    else if (moduleName.indexOf('PCLK0') !== -1) {
                                        selectField = sPCLK0SEL;
                                        inputSource = moduleSourceInformationArray[i].name;
                                    }
                                    else if (moduleName.indexOf('PCLK1') !== -1) {
                                        selectField = sPCLK1SEL;
                                        inputSource = moduleSourceInformationArray[i].name;
                                    }
                                    else if (moduleName.indexOf('PCLK2') !== -1) {
                                        selectField = sPCLK2SEL;
                                        inputSource = moduleSourceInformationArray[i].name;
                                    }
                                    else {
                                        selectField = sPCLK_S;
                                        inputSource = moduleSourceInformationArray[i].name;
                                    }

                                    // remove some characters from DIV source
                                    if (inputSource.indexOf('DIV') !== -1 && inputSource.indexOf(':') !== -1) {
                                        inputSource1 = inputSource;
                                        inputSource = inputSource1.slicePriorToX(':') + '+' + inputSource1.sliceAfterX('+');
                                    }

                                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                                        for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                            fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];
                                            if (fullFieldName.indexOf(inputSource) !== -1 && fullFieldName.indexOf(':') === inputSource.length) {
                                                writeNewValueToClockRegs(selectField, parseInt(fullFieldName.sliceAfterX(':'), 10));
                                                break;
                                            }
                                        }
                                    }
                                    generateRealModuleFrequency();
                                }
                                else if (moduleSourceInformationArray[i].color !== colorForDisallowed) {
                                    moduleSourceInformationArray[i].lastColor = moduleSourceInformationArray[i].color = 'black';
                                }
                                // clear text
                                context.fillStyle = 'white';
                                context.fillRect(moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y - 18, moduleSourceInformationArray[i].textLength + 10, 18);
                                // draw the candidates of input sources
                                context.fillStyle = moduleSourceInformationArray[i].color;
                                context.fillText(moduleSourceInformationArray[i].name, moduleSourceInformationArray[i].x, moduleSourceInformationArray[i].y);
                            }
                        }
                    }
                    // dividerFieldInformation part
                    if (dividerFieldInformation.name) {
                        if (mousePositionX >= dividerFieldInformation.x && mousePositionX <= (dividerFieldInformation.x + dividerFieldInformation.textLength) &&
                            mousePositionY >= (dividerFieldInformation.y - 18) && mousePositionY <= dividerFieldInformation.y) {
                            // update the content of dividerField
                            invokeDividerSettingDialog(dividerField);
                        }
                    }
                },
                generateRealModuleFrequency = function () {
                    moduleRealFrequency = 0;
                    // moduleSourceInformationArray part
                    for (i = 0, max = moduleSourceInformationArray.length; i < max; i += 1) {
                        if (moduleSourceInformationArray[i].color === colorForConfiguredByDiagram) {
                            fullFieldName = moduleSourceInformationArray[i].name;
                            if (fullFieldName.indexOf(sHCLK) === -1) {
                                if (fullFieldName.indexOf('MHz') !== -1) {
                                    moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 3) * 1000000;
                                }
                                else if (fullFieldName.indexOf('kHz') !== -1) {
                                    moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 3) * 1000;
                                }
                                else {
                                    moduleRealFrequency = parseFloat(fullFieldName.sliceAfterX(':'), fullFieldName.length - 2);
                                }
                            }
                            break;
                        }

                        if (i === max - 1) {
                            //window.alert('not yet')
                            return this;
                        }
                    }
                    // dividerFieldInformation part
                    if (moduleRealFrequency === 0) {
                        selectField = sHCLK_S;
                        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
                            for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                                fullFieldName = NUTOOL_CLOCK.g_CLKSEL[selectField][j];

                                if (readValueFromClockRegs(selectField) === parseInt(fullFieldName.sliceAfterX(':'), 10)) {
                                    moduleRealFrequency = decideInputClockFreq(fullFieldName.slicePriorToLastX(':'));

                                    break;
                                }
                                else if (j === maxJ - 1) {
                                    if (!g_bReadyForRelease && window.console) { window.console.log('"ERROR! generateRealModuleFrequency of buildHCLKandPCLKtab has an error'); }
                                }
                            }
                        }
                    }
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sHCLK_N)) {
                        moduleRealFrequency = moduleRealFrequency / getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL[sHCLK_N], readValueFromClockRegs(sHCLK_N));
                    }
                    else if (readValueFromClockRegs(sHCLK_N) !== -1) {
                        moduleRealFrequency = moduleRealFrequency / (readValueFromClockRegs(sHCLK_N) + 1);
                    }
                    // update the real output frequency
                    if (moduleRealFrequency !== 0) {
                        g_realHCLKoutputClock = moduleRealFrequency;
                        $("#HCLK_span_showRealFreq").text(g_realHCLKoutputClock.toHzString());
                    }
                    // for PCLK, PCLK0 and PCLK1 and PCLK2
                    fullFieldName = $("#HCLK_span_showRealFreq").text();
                    if (fullFieldName !== "") {
                        if (!NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL) &&
                            !NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL) &&
                            !NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
                            if (readValueFromClockRegs(sPCLK_S) !== -1) {
                                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK_S)) {
                                    selectFieldValue = readValueFromClockRegs(sPCLK_S).toString();
                                    for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[sPCLK_S].length; j < maxJ; j += 1) {
                                        if (NUTOOL_CLOCK.g_CLKSEL[sPCLK_S][j].sliceAfterX(':') === selectFieldValue) {
                                            selectFieldName = NUTOOL_CLOCK.g_CLKSEL[sPCLK_S][j].slicePriorToX(':');
                                            break;
                                        }
                                    }
                                    if (selectFieldName.indexOf('/') === -1) {
                                        moduleRealFrequency = fullFieldName.toFloat();
                                    }
                                    else {
                                        moduleRealFrequency = fullFieldName.toFloat() / parseFloat(selectFieldName.sliceAfterX('/'));
                                    }
                                }
                                else {
                                    moduleRealFrequency = fullFieldName.toFloat() / Math.pow(2, readValueFromClockRegs(sPCLK_S));
                                }
                            }
                            else {
                                moduleRealFrequency = fullFieldName.toFloat();
                            }

                            // dividerFieldInformation part
                            if (readValueFromClockRegs(sPCLK_N) !== -1) {
                                moduleRealFrequency = moduleRealFrequency / (readValueFromClockRegs(sPCLK_N) + 1);
                            }
                            // update the real output frequency
                            g_realPCLKoutputClock = moduleRealFrequency;
                            $("#PCLK_span_showRealFreq").text(g_realPCLKoutputClock.toHzString());

                            g_realPCLK0outputClock = 0;
                            g_realPCLK1outputClock = 0;
                            g_realPCLK2outputClock = 0;
                        }
                        else {
                            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL)) {
                                g_realPCLK0outputClock = fullFieldName.toFloat() / getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL[sPCLK0SEL], readValueFromClockRegs(sPCLK0SEL));
                                $("#PCLK0_span_showRealFreq").text(g_realPCLK0outputClock.toHzString());
                            }
                            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL)) {
                                g_realPCLK1outputClock = fullFieldName.toFloat() / getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL[sPCLK1SEL], readValueFromClockRegs(sPCLK1SEL));
                                $("#PCLK1_span_showRealFreq").text(g_realPCLK1outputClock.toHzString());
                            }
                            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
                                g_realPCLK2outputClock = fullFieldName.toFloat() / getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL[sPCLK2SEL], readValueFromClockRegs(sPCLK2SEL));
                                $("#PCLK2_span_showRealFreq").text(g_realPCLK2outputClock.toHzString());
                            }
                            g_realPCLKoutputClock = 0;
                        }
                    }

                    triggerMultiWayConfigure();
                    return this;
                },
                invokeDividerSettingDialog = function (dividerField) {
                    // close the last dialog
                    if ($('#dividerConfigureDialog').is(':visible')) {
                        $('#dividerConfigureDialog').dialog("destroy");
                    }

                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(dividerField)) {
                        dividerUpperLimit = [];
                        for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[dividerField].length; j < maxJ; j += 1) {
                            dividerUpperLimit.push(NUTOOL_CLOCK.g_CLKSEL[dividerField][j].slicePriorToX(':').sliceAfterX('/'));
                        }
                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                            content = '请设置值给除频器' + dividerField + '。合理的数值应该为' + dividerUpperLimit + '的其中一个。';
                            title = '设置值给除频器!' + dividerField;
                            okButton = '确认';
                        }
                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                            content = '請設置值給除頻器' + dividerField + '。合理的數值應該為' + dividerUpperLimit + '的其中一個。';
                            title = '設置值給除頻器' + dividerField;
                            okButton = '確認';
                        }
                        else {
                            content = 'Please configure a value to ' + dividerField + '. The feasible value should be one of ' + dividerUpperLimit + '.';
                            title = 'Configure a value to ' + dividerField;
                            okButton = 'Confirm';
                        }
                        // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
                        $('<div id="dividerConfigureDialog"><p>' + content + '</p><p class = "div_clock_composite">' + dividerField + ': </p><input id="' + dividerField + '_input_dialog" type="text" value="0" class = "div_clock_composite"/><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                            .dialog({
                                modal: false,
                                resizable: false,
                                title: title,
                                width: 500,
                                height: 'auto',
                                show: 'fade',
                                hide: 'fade',
                                buttons: [
                                    {
                                        text: okButton,
                                        click: function () {
                                            dividerInputValue = parseInt($("#" + dividerField + "_input_dialog").val(), 10).toString();
                                            for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[dividerField].length; j < maxJ; j += 1) {
                                                if (NUTOOL_CLOCK.g_CLKSEL[dividerField][j].slicePriorToX(':').sliceAfterX('/') === dividerInputValue) {
                                                    selectFieldName = NUTOOL_CLOCK.g_CLKSEL[dividerField][j];
                                                    break;
                                                }
                                            }
                                            dividerFieldInformation.name = '1/(' + dividerField + ': ' + dividerInputValue + ')';
                                            // clear text
                                            context.fillStyle = '#FFFFFF';
                                            dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                                            context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                                            // draw the candidates of input sources
                                            context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                                            dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                                            context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                                            // update dividerField
                                            writeNewValueToClockRegs(dividerField, selectFieldName.sliceAfterX(':'));
                                            generateRealModuleFrequency();

                                            if ($(this).is(':visible')) {
                                                $(this).dialog("destroy");
                                            }
                                        }
                                    }
                                ],
                                close: function () {
                                    $(this).dialog("destroy");
                                }
                            });

                        dividerInputValue = readValueFromClockRegs(dividerField).toString();
                        for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[dividerField].length; j < maxJ; j += 1) {
                            if (NUTOOL_CLOCK.g_CLKSEL[dividerField][j].sliceAfterX(':') === dividerInputValue) {
                                selectFieldName = NUTOOL_CLOCK.g_CLKSEL[dividerField][j];
                                break;
                            }
                        }
                        $("#" + dividerField + "_input_dialog").val(selectFieldName.slicePriorToX(':').sliceAfterX('/')).width(35).change(function () {
                            if (typeof (this.value) === 'undefined' || this.value === '' || this.value.length > 4 || !(/^\d+$/.test(this.value)) || dividerUpperLimit.indexOf(this.value) === -1) {
                                $("#" + dividerField + "_input_dialog").val('1');

                                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                                }
                                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                                }
                                else {
                                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                                }
                            }
                        });
                    }
                    else {
                        // determine dividerUpperLimit
                        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                            clockRegName = g_clockRegisterNames[i];
                            for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                                fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                                if (fullFieldName.indexOf(dividerField) !== -1 && fullFieldName.indexOf(':') === dividerField.length) {
                                    if (fullFieldName.indexOf('-') !== -1) {
                                        dividerUpperLimit = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - parseInt(fullFieldName.sliceAfterX('-'), 10) + 1;
                                    }
                                    else {
                                        dividerUpperLimit = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                    }

                                    dividerUpperLimit = Math.pow(2, dividerUpperLimit) - 1;
                                    break;
                                }
                            }
                        }

                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                            content = '请设置值给除频器' + dividerField + '。合理的范围从0到' + dividerUpperLimit + '。';
                            title = '设置值给除频器!' + dividerField;
                            okButton = '确认';
                        }
                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                            content = '請設置值給除頻器' + dividerField + '。合理的範圍從0到' + dividerUpperLimit + '。';
                            title = '設置值給除頻器' + dividerField;
                            okButton = '確認';
                        }
                        else {
                            content = 'Please configure a value to ' + dividerField + '. The feasible range is from 0 to ' + dividerUpperLimit + '.';
                            title = 'Configure a value to ' + dividerField;
                            okButton = 'Confirm';
                        }
                        // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
                        $('<div id="dividerConfigureDialog"><p>' + content + '</p><p class = "div_clock_composite">' + dividerField + ': </p><input id="' + dividerField + '_input_dialog" type="text" value="0" class = "div_clock_composite"/><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                            .dialog({
                                modal: false,
                                resizable: false,
                                title: title,
                                width: 500,
                                height: 'auto',
                                show: 'fade',
                                hide: 'fade',
                                buttons: [
                                    {
                                        text: okButton,
                                        click: function () {
                                            dividerInputValue = parseInt($("#" + dividerField + "_input_dialog").val(), 10);
                                            dividerFieldInformation.name = '1/(' + dividerField + ': ' + dividerInputValue + ' + 1)';
                                            // clear text
                                            context.fillStyle = '#FFFFFF';
                                            dividerFieldInformation.textLength = context.measureText(dividerFieldInformation.name).width;
                                            context.fillRect(dividerFieldInformation.x, dividerFieldInformation.y - 18, dividerFieldInformation.textLength, 25);
                                            // draw the candidates of input sources
                                            context.fillStyle = dividerFieldInformation.lastColor = dividerFieldInformation.color = colorForConfiguredByDiagram;
                                            dividerFieldInformation.x = dividerFieldInformation.x + (dividerFieldInformation.textLength - context.measureText(dividerFieldInformation.name).width) / 2;
                                            context.fillText(dividerFieldInformation.name, dividerFieldInformation.x, dividerFieldInformation.y);
                                            // update dividerField
                                            writeNewValueToClockRegs(dividerField, dividerInputValue);
                                            generateRealModuleFrequency();

                                            if ($(this).is(':visible')) {
                                                $(this).dialog("destroy");
                                            }
                                        }
                                    }
                                ],
                                close: function () {
                                    $(this).dialog("destroy");
                                }
                            });

                        $("#" + dividerField + "_input_dialog").val(readValueFromClockRegs(dividerField)).width(35).change(function () {
                            if (typeof (this.value) === 'undefined' || this.value === '' || this.value.length > 4 || !(/^\d+$/.test(this.value)) || parseInt(this.value, 10) > dividerUpperLimit || parseInt(this.value, 10) < 0) {
                                $("#" + dividerField + "_input_dialog").val('0');

                                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                                }
                                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                                }
                                else {
                                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                                }
                            }
                        });
                    }
                };
            // decide the size of canvas
            context.font = '18px Arial';
            context.fillStyle = 'black';

            // decide arrowLineLength
            inputSourceNumber = allowedInput.length;
            arrowLineLength = 0;
            fillTextArray = [];
            fillColorArray = [];
            for (i = 0, max = inputSourceNumber; i < max; i += 1) {
                if (allowedInput[i].indexOf(sHCLK) === -1) {
                    fillTextArray.push(allowedInput[i] + ': ' + decideInputClockFreq(allowedInput[i]).toHzString());
                }
                else {
                    fillTextArray.push(allowedInput[i]);
                }
                if (context.measureText(fillTextArray[fillTextArray.length - 1]).width > arrowLineLength) {
                    arrowLineLength = context.measureText(fillTextArray[fillTextArray.length - 1]).width;
                }

                if ($.inArray(allowedInput[i].slicePriorToX('/').toString(), g_enabledBaseClocks) !== -1) {
                    fillColorArray[i] = 'black';
                }
                else {
                    fillColorArray[i] = colorForDisallowed;
                }
            }

            arrowLineLength += 30; // add the width of arrowhead

            if (inputSourceNumber > 1) {
                // decide dividerPartLength
                if (dividerField !== '') {
                    dividerPartLength = arrowConstantLineLength + context.measureText('1/(' + dividerField + ': 0 + 1)').width;
                }
                else {
                    dividerPartLength = 0;
                }
                // decide the size of canvas
                canvasWidth = canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                canvasHeight = canvas_startPointY * 2 + (18 + 4) * (allowedInput.length - 1) + offsetY * 2;
            }
            else {
                // decide the size of canvas
                if (dividerField !== '') {
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText('1/(' + dividerField + ': 0 + 1)').width + arrowConstantLineLength + context.measureText(moduleName).width + canvas_startPointX;
                }
                else {
                    canvasWidth = canvas_startPointX + arrowLineLength + context.measureText(moduleName).width + canvas_startPointX;
                }
                canvasHeight = canvas_startPointY * 2 + offsetY * 2;
            }

            if (typeof adjacentInput !== 'undefined' && adjacentInput.length !== 0) {
                canvasHeight = canvas_startPointY * 2 + (18 + 4) * (adjacentInput.length - 1) + offsetY * 2;
            }

            canvasElement.setAttribute('width', canvasWidth);
            canvasElement.setAttribute('height', canvasHeight);
            context.font = '18px Arial';
            context.fillStyle = 'black';
            // start to draw
            x = canvas_startPointX;
            moduleSourceInformationArray = [];

            dividerFieldInformation = {};
            dividerFieldInformation.name = '';
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(dividerField)) {
                dividerFieldInformationNameEnding = ')';
            }
            else {
                dividerFieldInformationNameEnding = ' + 1)';
            }

            if (inputSourceNumber > 1) {
                // draw the candidates of input sources
                for (i = 0, max = inputSourceNumber; i < max; i += 1) {
                    y = canvas_startPointY + (18 + 4) * i + offsetY;
                    context.fillStyle = fillColorArray[i];
                    context.fillText(fillTextArray[i], x, y);
                    line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                    line.drawWithArrowheads(context);
                    //stash the source information
                    moduleSourceInformationArray.push({
                        name: fillTextArray[i],
                        x: x,
                        y: y,
                        textLength: context.measureText(fillTextArray[i]).width,
                        color: fillColorArray[i],
                        lastColor: fillColorArray[i]
                    });
                }
                // draw trapezoid
                context.beginPath();
                context.moveTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) + 2 * offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength + trapezoidHeight, canvas_startPointY + offsetY);
                context.lineTo(canvas_startPointX + arrowLineLength, canvas_startPointY);
                context.stroke();
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== '') {
                    line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight,
                        canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY,
                        canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength,
                        canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY);
                    line.drawWithArrowheads(context);
                    dividerPartLength += arrowConstantLineLength;

                    x = canvas_startPointX + arrowLineLength + trapezoidHeight + arrowConstantLineLength;
                    y = canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY + 18 / 2 - 2;
                    context.fillText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding, x, y);
                    dividerPartLength += context.measureText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding).width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding,
                        nameEnding: dividerFieldInformationNameEnding,
                        x: x,
                        y: y,
                        textLength: context.measureText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding).width,
                        color: 'black',
                        lastColor: 'black'
                    };
                }
                // draw the final part of the module name
                line = new Line(canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength,
                    canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY);
                line.drawWithArrowheads(context);
                context.fillText(moduleName,
                    canvas_startPointX + arrowLineLength + trapezoidHeight + dividerPartLength + arrowConstantLineLength,
                    canvas_startPointY + (18 + 4) * (inputSourceNumber - 1) / 2 + offsetY + 18 / 2 - 2);
            }
            else {
                y = canvas_startPointY + offsetY;
                context.fillText(fillTextArray[0], x, y);
                line = new Line(x, y + 2, x + arrowLineLength, y + 2);
                line.drawWithArrowheads(context);
                // stash the source information
                moduleSourceInformationArray.push({
                    name: fillTextArray[0],
                    x: x,
                    y: y,
                    textLength: context.measureText(fillTextArray[0]).width,
                    color: fillColorArray[0],
                    lastColor: fillColorArray[0]
                });
                // draw divider part
                dividerPartLength = 0;
                if (dividerField !== '') {
                    x = canvas_startPointX + arrowLineLength;
                    context.fillText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding, x, y + 18 / 2 - 2);
                    dividerPartLength += context.measureText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding).width;
                    // stash the dividerField information
                    dividerFieldInformation = {
                        name: '1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding,
                        nameEnding: dividerFieldInformationNameEnding,
                        x: x,
                        y: (y + 18 / 2 - 2),
                        textLength: context.measureText('1/(' + dividerField + ': 0' + dividerFieldInformationNameEnding).width,
                        color: 'black',
                        lastColor: 'black'
                    };

                    line = new Line(canvas_startPointX + arrowLineLength + dividerPartLength,
                        y,
                        canvas_startPointX + arrowLineLength + dividerPartLength + arrowConstantLineLength,
                        y);
                    line.drawWithArrowheads(context);

                    dividerPartLength = dividerPartLength + arrowConstantLineLength;
                }
                // draw the final part of the module name
                context.fillText(moduleName,
                    canvas_startPointX + arrowLineLength + dividerPartLength,
                    y + 18 / 2 - 2);
            }
            // add events
            g_utility.addEvent(canvasElement, "mousemove", function (evt) { getMousePos(canvasElement, evt); moduleDiagramMouseMoveHandler(); });
            g_utility.addEvent(canvasElement, "click", function () { moduleDiagramClickHandler(); });
            // build the span of the real output frequency
            if (moduleName.indexOf(sHCLK) !== -1) {
                appendElementString = "<div id='HCLK_div_showRealFreq'><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>" + sHCLK + "<span class=realOutput_after_span>: </span><span id='HCLK_span_showRealFreq'></span></p></div>";
                $tab_3.append(appendElementString);
                $("#HCLK_div_showRealFreq")[0].setAttribute('style', 'position:absolute; top:' + (85 + canvasHeight + 30) + 'px; width: 90%;');
                $('#HCLK_div_showRealFreq').css('border-bottom', '8px solid black');
                $("#HCLK_span_showRealFreq").css('color', '#2E2EFE');
            }
            else if (moduleName.indexOf('PCLK0') !== -1) {
                appendElementString = "<div id='PCLK0_div_showRealFreq'><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>PCLK0<span class=realOutput_after_span>: </span><span id='PCLK0_span_showRealFreq'></span></p></div>";
                $tab_3.append(appendElementString);
                $("#PCLK0_div_showRealFreq")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 30) + 'px;');
                $("#PCLK0_span_showRealFreq").css('color', '#2E2EFE');
            }
            else if (moduleName.indexOf('PCLK1') !== -1) {
                appendElementString = "<div id='PCLK1_div_showRealFreq'><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>PCLK1<span class=realOutput_after_span>: </span><span id='PCLK1_span_showRealFreq'></span></p></div>";
                $tab_3.append(appendElementString);
                $("#PCLK1_div_showRealFreq")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 60) + 'px;');
                $("#PCLK1_span_showRealFreq").css('color', '#2E2EFE');
            }
            else if (moduleName.indexOf('PCLK2') !== -1) {
                appendElementString = "<div id='PCLK2_div_showRealFreq'><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>PCLK2<span class=realOutput_after_span>: </span><span id='PCLK2_span_showRealFreq'></span></p></div>";
                $tab_3.append(appendElementString);
                $("#PCLK2_div_showRealFreq")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 90) + 'px;');
                $("#PCLK2_span_showRealFreq").css('color', '#2E2EFE');
            }
            else if (moduleName.indexOf(sPCLK) !== -1) {
                appendElementString = "<div id='PCLK_div_showRealFreq'><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>" + sPCLK + "<span class=realOutput_after_span>: </span><span id='PCLK_span_showRealFreq'></span></p></div>";
                $tab_3.append(appendElementString);
                $("#PCLK_div_showRealFreq")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 30) + 'px;');
                $("#PCLK_span_showRealFreq").css('color', '#2E2EFE');
            }
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                $(".specificRealOutput_before_span").text('');
                $(".realOutput_after_span").text('的时脉频率: ');
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                $(".specificRealOutput_before_span").text('');
                $(".realOutput_after_span").text('的時脈頻率: ');
            }
            else {
                $(".specificRealOutput_before_span").text('The clock of ');
                $(".realOutput_after_span").text(': ');
            }
            // based on the value of clock registers to generate the diagram
            initializeModule();
        };
        getMousePos = function (canvas, evt) {
            rect = canvas.getBoundingClientRect();
            // return relative mouse position
            mousePositionX = evt.clientX - rect.left;
            mousePositionY = evt.clientY - rect.top;

            return this;
        };
        add_tab_3_handler = function () {
            var CPUCLKLimit;

            if (isNumberic(NUTOOL_CLOCK.g_CPUCLKLimit)) {
                CPUCLKLimit = NUTOOL_CLOCK.g_CPUCLKLimit;
            }
            else {
                CPUCLKLimit = parseInt(NUTOOL_CLOCK.g_CPUCLKLimit[g_partNumber_package.slicePriorToX('(')], 10);
            }

            if (!g_bPressEnter) {
                if ($('#add-tab-3').css('display') !== 'none') {
                    if (g_realHCLKoutputClock > CPUCLKLimit) {
                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                            invokeWarningDialog('CPU频率上限为' + CPUCLKLimit.toHzString() + '。 ' + sHCLK + '频率不应超过其限制。');
                        }
                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                            invokeWarningDialog('CPU頻率上限為' + CPUCLKLimit.toHzString() + '。 ' + sHCLK + '頻率不應超過其限制。');
                        }
                        else {
                            invokeWarningDialog('The upper limit of CPU frequency is ' + CPUCLKLimit.toHzString() + '. The ' + sHCLK + ' frequency should not run beyond the limit.');
                        }

                        return;
                    }

                    if (!$('#tab-4')[0]) {
                        buildModuleTab();
                    }
                    $("#add-tab-3").hide();
                    if (g_finalStep < $("#tabs").tabs('option', 'active') + 1) {
                        g_finalStep = $("#tabs").tabs('option', 'active') + 1;
                    }
                }
            }
            else {
                g_bPressEnter = false;
            }
        };

        // build the infrastructure
        removeAlldialogs();
        if (!$("#tab-4")[0]) {
            $("#tabs ul").append("<li id='li-3'><a href='#tab-3'>" + sHCLK + "/" + sPCLK + "</a></li>");
            $("#tabs").append("<div id='tab-3'></div>");
        }
        else {
            $("<li id='li-3'><a href='#tab-3'>" + sHCLK + "/" + sPCLK + "</a></li>").insertBefore("#li-4");
            $("<div id='tab-3'></div>").insertBefore("#tab-4");
        }
        $tab_3 = $("#tab-3");
        // get the status of Base Clocks
        g_realLIRCoutputClock = 0;
        g_realHIRCoutputClock = 0;
        g_realHIRC2outputClock = 0;
        g_realHIRC48outputClock = 0;
        g_realMIRCoutputClock = 0;
        g_realMIRC1P2MoutputClock = 0;
        g_realRTC32koutputClock = 0;
        g_realLXToutputClock = 0;
        g_realHXToutputClock = 0;

        g_enabledBaseClocks = [];
        if (isFieldBe1('OSC10K_EN'.toEquivalent())) {
            g_realLIRCoutputClock = NUTOOL_CLOCK.g_LIRCfrequency;
            g_enabledBaseClocks.push(sLIRC);
        }
        if (isFieldBe1('OSC22M_EN'.toEquivalent()) || isFieldBe1('HIRC1EN')) {
            g_realHIRCoutputClock = NUTOOL_CLOCK.g_HIRCfrequency;
            g_enabledBaseClocks.push(sHIRC);
        }
        if (isFieldBe1('OSC22M2_EN'.toEquivalent()) || isFieldBe1('HIRC2EN')) {
            g_realHIRC2outputClock = NUTOOL_CLOCK.g_HIRC2frequency;
            g_enabledBaseClocks.push(sHIRC2);
        }
        if (isFieldBe1('HIRC48EN')) {
            g_realHIRC48outputClock = NUTOOL_CLOCK.g_HIRC48frequency;
            g_enabledBaseClocks.push('HIRC48');
        }
        if (isFieldBe1('MIRCEN')) {
            g_realMIRCoutputClock = NUTOOL_CLOCK.g_MIRCfrequency;
            g_enabledBaseClocks.push('MIRC');
        }
        if (isFieldBe1('MIRC1P2MEN')) {
            g_realMIRC1P2MoutputClock = NUTOOL_CLOCK.g_MIRC1P2Mfrequency;
            g_enabledBaseClocks.push('MIRC1P2M');
        }
        if (NUTOOL_CLOCK.g_RTC32kfrequency !== 0) {
            g_realRTC32koutputClock = NUTOOL_CLOCK.g_RTC32kfrequency;
            g_enabledBaseClocks.push('RTC32k');
        }
        if (isFieldBe1(sXTL32K_EN)) {
            g_realLXToutputClock = 32768;
            g_enabledBaseClocks.push(sLXT);
        }
        if (isFieldBe1('LIRC32KEN')) {
            g_realLXToutputClock = 32000;
            g_enabledBaseClocks.push(sLXT);
        }
        if (isFieldBe1(sXTL12M_EN)) {
            g_realHXToutputClock = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000;
            g_realHSUSBOTGPHYoutputClock = NUTOOL_CLOCK.g_HSUSBOTGPHYfrequency;
            g_enabledBaseClocks.push(sHXT);
            g_enabledBaseClocks.push('HSUSB_OTG_PHY');
        }
        if ((!isFieldBe1('PD') || isFieldBe1('PLLEN')) && g_realPLLoutputClock > 0) {
            g_enabledBaseClocks.push(sPLL);
        }
        if (!isFieldBe1('APD') && g_realAPLLoutputClock > 0) {
            g_enabledBaseClocks.push('APLL');
        }
        if (isFieldBe1('PLL2CKEN') && g_realPLL2outputClock > 0) {
            g_enabledBaseClocks.push('PLL2');
        }
        if (isFieldBe1('PLL2CKEN') && g_realPLL480MoutputClock > 0) {
            g_enabledBaseClocks.push('PLL480M');
        }
        if (!isFieldBe1('PDFN') && g_realPLLFNoutputClock > 0) {
            g_enabledBaseClocks.push('PLLFN');
        }
        g_enabledBaseClocks.push(sHCLK);

        allowedInput = [];
        selectField = sHCLK_S;
        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(selectField)) {
            for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                allowedInput.push(NUTOOL_CLOCK.g_CLKSEL[selectField][j].slicePriorToX(':'));
            }
        }

        // Next Step button part
        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $tab_3[0].appendChild(ce("button", "add-tab-3", "下一步"));
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $tab_3[0].appendChild(ce("button", "add-tab-3", "下一步"));
        }
        else {
            $tab_3[0].appendChild(ce("button", "add-tab-3", "Next Step"));
        }

        // HCLK part
        $tab_3[0].appendChild(ce("canvas", "HCLK_canvas"));
        $HCLK_canvas = $("#HCLK_canvas");
        $HCLK_canvas[0].setAttribute('style', 'z-index:1; position:absolute; background-color: #FFFFFF; left:30px; top:' + 85 + 'px; border: 1px solid black;');
        drawHCLKorPCLKdiagram($HCLK_canvas[0], sHCLK, sHCLK_N, allowedInput);
        // Difference occurs
        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL) ||
            NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL) ||
            NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
            HCLKblockHeight = 85 + canvasHeight + 30 + 60;
            PCLKblockOLeftffset = 0;

            // PCLK0 part
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL)) {
                allowedInput = [];
                g_enabledBaseClocks.push('PCLK0');
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[sPCLK0SEL].length; j < maxJ; j += 1) {
                    allowedInput.push(NUTOOL_CLOCK.g_CLKSEL[sPCLK0SEL][j].slicePriorToX(':'));
                }
                $tab_3[0].appendChild(ce("canvas", "PCLK0_canvas"));
                $PCLK0_canvas = $("#PCLK0_canvas");
                $PCLK0_canvas[0].setAttribute('style', 'z-index:1; position:absolute; background-color: #FFFFFF; left:30px; top:' + HCLKblockHeight + 'px; border: 1px solid black;');
                drawHCLKorPCLKdiagram($PCLK0_canvas[0], 'PCLK0', '', allowedInput);
                PCLKblockOLeftffset += 270;
            }

            // PCLK1 part
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL)) {
                allowedInput = [];
                g_enabledBaseClocks.push('PCLK1');
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[sPCLK1SEL].length; j < maxJ; j += 1) {
                    allowedInput.push(NUTOOL_CLOCK.g_CLKSEL[sPCLK1SEL][j].slicePriorToX(':'));
                }
                $tab_3[0].appendChild(ce("canvas", "PCLK1_canvas"));
                $PCLK1_canvas = $("#PCLK1_canvas");
                $PCLK1_canvas[0].setAttribute('style', `z-index:1; position:absolute; background-color: #FFFFFF; left:${30 + PCLKblockOLeftffset}px; top:` + HCLKblockHeight + 'px; border: 1px solid black;');
                drawHCLKorPCLKdiagram($PCLK1_canvas[0], 'PCLK1', '', allowedInput);
                PCLKblockOLeftffset += 270;
            }

            // PCLK2 part
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
                allowedInput = [];
                g_enabledBaseClocks.push('PCLK2');
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[sPCLK2SEL].length; j < maxJ; j += 1) {
                    allowedInput.push(NUTOOL_CLOCK.g_CLKSEL[sPCLK2SEL][j].slicePriorToX(':'));
                }
                $tab_3[0].appendChild(ce("canvas", "PCLK2_canvas"));
                $PCLK2_canvas = $("#PCLK2_canvas");
                $PCLK2_canvas[0].setAttribute('style', `z-index:1; position:absolute; background-color: #FFFFFF; left:${30 + PCLKblockOLeftffset}px; top:` + HCLKblockHeight + 'px; border: 1px solid black;');
                drawHCLKorPCLKdiagram($PCLK2_canvas[0], 'PCLK2', '', allowedInput);
                PCLKblockOLeftffset += 270;
            }

            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
                $("#add-tab-3")[0].setAttribute('style', 'position:absolute; left:720px; top:' + (HCLKblockHeight + canvasHeight + 30) + 'px;');
            } else if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL)) {
                $("#add-tab-3")[0].setAttribute('style', 'position:absolute; left:450px; top:' + (HCLKblockHeight + canvasHeight + 30) + 'px;');
            } else {
                $("#add-tab-3")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 30 + 40) + 'px;');
            }
        }
        else {
            g_enabledBaseClocks.push(sPCLK);
            // PCLK part
            allowedInput = [];
            selectField = sPCLK_S;
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK_S)) {
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectField].length; j < maxJ; j += 1) {
                    allowedInput.push(NUTOOL_CLOCK.g_CLKSEL[selectField][j].slicePriorToX(':'));
                }
            }
            else {
                allowedInput = [sHCLK];
            }

            $tab_3[0].appendChild(ce("canvas", "PCLK_canvas"));
            $PCLK_canvas = $("#PCLK_canvas");
            HCLKblockHeight = 85 + canvasHeight + 30 + 60;
            $PCLK_canvas[0].setAttribute('style', 'z-index:1; position:absolute; background-color: #FFFFFF; left:30px; top:' + HCLKblockHeight + 'px; border: 1px solid black;');

            if (readValueFromClockRegs(sPCLK_N) === -1) {
                drawHCLKorPCLKdiagram($PCLK_canvas[0], sPCLK, '', allowedInput);
            }
            else {
                drawHCLKorPCLKdiagram($PCLK_canvas[0], sPCLK, sPCLK_N, allowedInput);
            }
            $("#add-tab-3")[0].setAttribute('style', 'position:absolute; top:' + (HCLKblockHeight + canvasHeight + 30 + 40) + 'px;');
        }

        $("#add-tab-3").addClass("css_btn_class");
        g_utility.addEvent($("#add-tab-3")[0], "click", add_tab_3_handler);
        $("#tabs").tabs("refresh");
        $("#tabs").tabs({ active: 2 });
        if ($("#tabs").tabs('option', 'active') !== 2) {
            $("#tabs").tabs({ active: 1 });
        }

        // adjust the size of the relevant UI elements
        if ($('#clockRegsTree').css('display') !== 'none') {
            $tabs.css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            $('#tab-3').css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
        }
        else {
            $tabs.css('width', (g_Dialog_Width - 8) + 'px');
            $('#tab-3').css('width', (g_Dialog_Width - 8) + 'px');
        }
        $tabs.css('height', (g_Dialog_Height - 8) + 'px');
        $('#tab-3').css('height', (g_Dialog_Height - 8) + 'px');

        // initialization
        if (command !== 'single' && g_finalStep > ($("#tabs").tabs('option', 'active') + 1)) {
            add_tab_3_handler();
        }
        if ($("#tab-4")[0]) {
            $("#add-tab-3").hide();
        }
    }

    function buildPLLclockTab(command) {
        var i,
            max,
            $tabs = $("#tabs"),
            $tab_2,
            appendElementString,
            parent,
            localRealPLLoutputClock = 0,
            localRealPLL2outputClock = 0,
            localRealAPLLoutputClock = 0,
            localRealPLLFNoutputClock = 0,
            currentHtmlFor,
            outputFrequency = 0,
            floorInteger,
            ceilInteger,
            resultFromFloor,
            resultFromCeil,
            valuePLL2_N,
            opt = {},
            $PLL_inaccuracy_select,
            FIN = [],
            aaDataArray = [],
            PLLREMAP,
            OUT_DV,
            IN_DV,
            FB_DV,
            NR,
            NF,
            NO,
            PLLSRCSEL,
            PLLHSEPSC,
            PLLMULCFG,
            maxPLLREMAP,
            maxOUT_DV,
            maxIN_DV,
            maxFB_DV,
            recordedPLLREMAP,
            recordedPLLCTL,
            recordedIntputSource,
            bPassconstrains = false,
            inputClockFreq,
            inputClockFreq1,
            outputClockFreq,
            calculatedinaccuracy,
            iDisplayLengthNumber = 6,
            aTrs = [],
            PLLREMAPvalue,
            BPvalue,
            PLLCTLvalue,
            PLL_SRCvalue,
            mask,
            backupValue,
            bSort = false,
            sTitle_Input_inner = "",
            sTitle_RealOutput_inner = "",
            sTitle_Inaccuracy_inner = "",
            sZeroRecords_inner = "",
            sInfo_inner = "",
            sInfoEmpty_inner = "",
            sPrevious_inner = "",
            sNext_inner = "",
            sSearch_inner = "",
            sClickSort_inner = "",
            buildOneSetOfClock,
            buildPLLCTLtable,
            add_tab_2_handler,
            calculatePLL2frequency,
            minFIN,
            maxFIN,
            minFINd2dNR,
            maxFINd2dNR,
            minFINd2dNR1,
            maxFINd2dNR1,
            minFCO,
            maxFCO,
            minFCO1,
            maxFCO1,
            minFOUT,
            maxFOUT,
            minFOUT1,
            maxFOUT1,
            sLXT = 'HXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sHCLK_S = 'HCLK_S'.toEquivalent().toString(),
            sPLLCON = 'PLLCON'.toEquivalent().toString(),
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString();

        minFOUT = 0;
        maxFOUT = 0;
        if (g_chipType === "NUC400") {
            iDisplayLengthNumber = 4;
            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 84000000;
            }
            if (g_realPLL2outputClock === 0) {
                localRealPLL2outputClock = 240000000;
            }
        }
        else if (g_chipType.indexOf("M25") === 0) {
            minFINd2dNR = 4000000;
            maxFINd2dNR = 8000000;
            minFCO = 64000000;
            maxFCO = 100000000;
            minFOUT = 16000000;
            maxFOUT = 100000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "M2351" || g_chipType === 'M2354' || g_chipType === 'M261') {
            minFINd2dNR = 2000000;
            maxFINd2dNR = 8000000;
            minFCO = 96000000;
            maxFCO = 200000000;
            minFOUT = 24000000;
            maxFOUT = 144000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "M451" || g_chipType === "NUC1262" ||
            g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
            minFIN = 3200000;
            maxFIN = 150000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 8000000;
            minFCO = 200000000;
            maxFCO = 500000000;

            if (g_realPLLoutputClock === 0) {
                if (g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
                    localRealPLLoutputClock = 96000000;
                }
                else if (g_chipType === "NUC1262") {
                    localRealPLLoutputClock = 144000000;
                }
                else {
                    localRealPLLoutputClock = 72000000;
                }
            }
        }
        else if (g_chipType.indexOf("M460") === 0) {
            iDisplayLengthNumber = 2;

            // for PLL
            minFINd2dNR = 4 * 1000000;
            maxFINd2dNR = 8 * 1000000;
            minFCO = 200 * 1000000;
            maxFCO = 500 * 1000000;
            minFOUT = 50 * 1000000;
            maxFOUT = 500 * 1000000;
            // for PLLFN
            minFINd2dNR1 = 1 * 1000000;
            maxFINd2dNR1 = 8 * 1000000;
            minFCO1 = 200 * 1000000;
            maxFCO1 = 500 * 1000000;
            minFOUT1 = 50 * 1000000;
            maxFOUT1 = 500 * 1000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 192000000;
            }
            if (g_realPLLFNoutputClock === 0) {
                localRealPLLFNoutputClock = 180000000;
            }
        }
        else if (g_chipType.indexOf("M480") === 0) {
            minFINd2dNR = 4000000;
            maxFINd2dNR = 8000000;
            minFCO = 200000000;
            maxFCO = 500000000;
            minFOUT = 50000000;
            maxFOUT = 500000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 72000000;
            }
        }
        else if (g_chipType === "NUC100AN" || g_chipType === "NUC100BN" || g_chipType === "NUC100CN" ||
            g_chipType === "M051AN" || g_chipType === "M0519" || g_chipType === "NM1500") {
            minFIN = 3200000;
            maxFIN = 150000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 8000000;
            minFCO = 100000000;
            maxFCO = 200000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "NUC100DN" || g_chipType === "NUC131" || g_chipType === "M0518" ||
            g_chipType === "NUC200AN" || g_chipType === "NUC200AE" || g_chipType === "NUC2201" ||
            g_chipType === "NUC029xDE" || g_chipType === "NUC029xEE") {
            minFIN = 3200000;
            maxFIN = 150000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 7500000;
            minFCO = 100000000;
            maxFCO = 200000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "NUC122AN") {
            minFIN = 3200000;
            maxFIN = 150000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 7500000;
            minFCO = 100000000;
            maxFCO = 500000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "NUC121AE") {
            minFIN = 4000000;
            maxFIN = 24000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 8000000;
            minFCO = 200000000;
            maxFCO = 500000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 96000000;
            }
        }
        else if (g_chipType === "NUC123AN_AE" || g_chipType === "M0564" ||
            g_chipType.indexOf("NUC126") === 0 || g_chipType === "NUC029xGE") {
            minFIN = 4000000;
            maxFIN = 24000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 8000000;
            minFCO = 100000000;
            maxFCO = 200000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "MINI58") {
            minFIN = 4000000;
            maxFIN = 24000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 7500000;
            minFCO = 100000000;
            maxFCO = 200000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 50000000;
            }
        }
        else if (g_chipType === "NANO100AN") {
            minFIN = 0;
            maxFIN = 0;
            minFINd2dNR = 0;
            maxFINd2dNR = 0;
            minFOUT = minFCO = 0;             // min FOUT
            maxFOUT = maxFCO = 120 * 1000000; // max FOUT

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 96000000;
            }
        }
        else if (g_chipType === "NANO100BN") {
            minFIN = 0;
            maxFIN = 0;
            minFINd2dNR = 0;
            maxFINd2dNR = 0;
            minFOUT = minFCO = 48 * 1000000; // min FOUT
            maxFOUT = maxFCO = 96 * 1000000; // max FOUT

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 96000000;
            }
        }
        else if (g_chipType === "NANO112") {
            minFIN = 800000;
            maxFIN = 2000000;
            minFINd2dNR = 0;
            maxFINd2dNR = 0;
            minFOUT = minFCO = 16 * 1000000; // min FOUT
            maxFOUT = maxFCO = 32 * 1000000; // max FOUT

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 16000000;
            }
        }
        else if (g_chipType === "NANO103") {
            minFIN = 800000;
            maxFIN = 2000000;
            minFINd2dNR = 0;
            maxFINd2dNR = 0;
            minFOUT = minFCO = 16 * 1000000; // min FOUT
            maxFOUT = maxFCO = 36 * 1000000; // max FOUT

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 16000000;
            }
        }
        else if (g_chipType === "APM32E103xCxE") {
            minFOUT = minFCO = 0;             // min FOUT
            maxFOUT = maxFCO = 120 * 1000000; // max FOUT

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }
        else if (g_chipType === "NUC505") {
            iDisplayLengthNumber = 2;

            minFIN = 0;
            maxFIN = 0;
            // for PLL
            minFINd2dNR = 5 * 1000000;
            maxFINd2dNR = 80 * 1000000;
            minFCO = 300 * 1000000;
            maxFCO = 1000 * 1000000;
            // for APLL
            minFINd2dNR1 = 2.5 * 1000000;
            maxFINd2dNR1 = 80 * 1000000;
            minFCO1 = 200 * 1000000;
            maxFCO1 = 500 * 1000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 240000000;
            }
            if (g_realAPLLoutputClock === 0) {
                localRealAPLLoutputClock = 240000000;
            }
        }
        else {
            minFIN = 4000000;
            maxFIN = 24000000;
            minFINd2dNR = 800000;
            maxFINd2dNR = 7500000;
            minFCO = 100000000;
            maxFCO = 200000000;

            if (g_realPLLoutputClock === 0) {
                localRealPLLoutputClock = 48000000;
            }
        }

        buildOneSetOfClock = function (hostDiv, enableField, name, defaultValue, unitHz, bEnable, bHasSelect) {
            if (bHasSelect) {
                if (bEnable) {
                    appendElementString = "<div id='" + enableField + "_div'><br /><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field'/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = '" + name + "_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = '" + name + "_" + enableField + "_p div_clock_composite'>" + unitHz + "  &#177</p><select id ='" + name + "_inaccuracy_select'></select><br /></div>";
                }
                else {
                    appendElementString = "<div id='" + enableField + "_div'><br /><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field'/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable selected'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = '" + name + "_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = '" + name + "_" + enableField + "_p div_clock_composite'>" + unitHz + "  &#177</p><select id ='" + name + "_inaccuracy_select'></select><br /></div>";
                }
            } else {
                // for PLL2 and PLL480M
                if (bEnable) {
                    appendElementString = "<div id='" + enableField + "_div'><br /><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field'/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = '" + name + "_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = '" + name + "_" + enableField + "_p div_clock_composite'>" + unitHz + " / PLL480M: 480MHz</p><br /></div>";
                }
                else {
                    appendElementString = "<div id='" + enableField + "_div'><br /><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field'/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable selected'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = '" + name + "_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = '" + name + "_" + enableField + "_p div_clock_composite'>" + unitHz + " / PLL480M: 480MHz</p><br /></div>";
                }
            }
            hostDiv.append(appendElementString);

            appendElementString = "<div id='" + name + "_div_showRealFreq'><br /><p class = 'div_clock_composite'><span class=specificRealOutput_before_span>The clock of </span>" + name + "<span class=realOutput_after_span>: </span><span id='" + name + "_span_showRealFreq'></span></p></div><br /><br />";
            hostDiv.append(appendElementString);

            if (bHasSelect) {
                $PLL_inaccuracy_select = $("#" + name + "_inaccuracy_select");
                for (i = 0; i < 11; i += 1) {
                    opt = window.document.createElement("option");
                    try {
                        opt.innerHTML = opt.value = i + '%';
                        opt.id = name + '_inaccuracy_' + i + '%';
                    }
                    catch (err) { }
                    $PLL_inaccuracy_select[0].appendChild(opt);
                }
                $PLL_inaccuracy_select.val('0%');

                $PLL_inaccuracy_select.on('change', function () {
                    if (name === sPLL) {
                        buildPLLCTLtable($('#PD_input').val(), false, $PLL_inaccuracy_select.val(), sPLLCON);
                    }
                    else if (name === 'APLL') { // APLL
                        buildPLLCTLtable($('#APD_input').val(), false, $PLL_inaccuracy_select.val(), 'APLLCTL');
                    }
                    else if (name === 'PLLFN') {
                        buildPLLCTLtable($('#PDFN_input').val(), false, $PLL_inaccuracy_select.val(), 'PLLFNCTL0');
                    }
                });
            }

            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                $("#pll_clocks_span").text(sPLL);
                $(".enable_span").text('启用');
                $(".disable_span").text('停用');
                $(".specificRealOutput_before_span").text('');
                $(".realOutput_after_span").text('的时脉频率: ');
                $('[title]').prop('title', '输入期望值');
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                $("#pll_clocks_span").text(sPLL);
                $(".enable_span").text('啟用');
                $(".disable_span").text('停用');
                $(".specificRealOutput_before_span").text('');
                $(".realOutput_after_span").text('的時脈頻率: ');
                $('[title]').prop('title', '輸入期望值');
            }
            else {
                $("#pll_clocks_span").text(sPLL);
                $(".enable_span").text('Enable');
                $(".disable_span").text('Disable');
                $(".specificRealOutput_before_span").text('The clock of ');
                $(".realOutput_after_span").text(': ');
                $('[title]').prop('title', 'Input the expected value');
            }
            $("#" + name + "_span_showRealFreq").css('color', '#2E2EFE');

            $("#" + enableField + "_input").width(55);
            $("#" + enableField + "_input").height(20);
            $("#PLL2CKEN_input").width(78);
        };
        buildPLLCTLtable = function (expectationFrequency, bClickFromRegister, inaccuracy, registerName) {
            var formulaType = "General",
                INDIV_UpperLimit,
                PLLMLP_UpperLimit,
                oTable = null,
                inputSource;

            if (typeof (inaccuracy) !== 'undefined') {
                // remove the last table
                if (registerName === sPLLCON) {
                    $('#PLLCTLtable').dataTable().fnDestroy();
                }
                else if (registerName === 'APLLCTL') { // APLLCTL
                    $('#APLLCTLtable').dataTable().fnDestroy();
                }
                else if (registerName === 'PLLFNCTL0') {
                    $('#PLLFNCTLtable').dataTable().fnDestroy();
                }

                // default inaccuracy is 0%
                inaccuracy = parseInt(inaccuracy.slice(0, inaccuracy.length - 1), 10);
                expectationFrequency = parseFloat(expectationFrequency, 10) * 1000000; // MHz

                FIN = [];
                if (isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN')) {
                    if (g_chipType === "NUC121AE" || g_chipType === "NUC1262" || g_chipType === "APM32E103xCxE") {
                        FIN.push(sHIRC + '/2');
                    }
                    else if (g_chipType.indexOf("M25") === 0 || g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
                        FIN.push(sHIRC + '/4');
                    }
                    else {
                        FIN.push(sHIRC);
                    }
                }
                if (isFieldBe1('MIRCEN') &&
                    (g_chipType.indexOf("M25") === 0 || g_chipType === "NANO103")) {
                    FIN.push('MIRC');
                }
                if (isFieldBe1(sXTL12M_EN)) {
                    FIN.push(sHXT);
                    if (g_chipType === "APM32E103xCxE") {
                        FIN.push(sHXT + '/2');
                    }
                }

                formulaType = "General";
                if (checkForField('FB_DV:5-0')) {
                    formulaType = "NANO100AN_BN";
                }
                else if (checkForField('PLL_MLP:5-0')) {
                        formulaType = "NANO112_103";
                }
                else if (checkForField('PLLREMAP:20')) {
                        formulaType = "NUC400";
                }
                else if (checkForField('FBDIV:6-0')) {
                        formulaType = "NUC505(PLL)";
                }
                else if (checkForField('FRAC:31-20')) {
                        formulaType = "NUC505(APLL)";
                }
                else if (checkForField('FBDIV:5-0')) {
                        formulaType = "M251";
                }
                else if (checkForField('STBSEL:23')) {
                        formulaType = "M460(PLL)";
                }
                else if (checkForField('FRDIV:27-16')) {
                        formulaType = "M460(PLLFN)";
                }
                else if (checkForField('PLLSRCSEL')) {
                        formulaType = "APM32E103xCxE";
                }
                else if (g_chipType.indexOf("M480") === 0 || g_chipType === 'M2351' || g_chipType === 'M2354' || g_chipType === 'M261') {
                    formulaType = "M480";
                }

                aaDataArray = [];
                // if we use the recorded data, put it in the first row and do not sort the table.
                if (bClickFromRegister) {
                    bSort = false;
                    // OUT_DV, IN_DV, FB_DV
                    recordedPLLCTL = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                    recordedPLLREMAP = (g_clockRegs[registerName] & (1 << 20) >>> 0) ? 1 : 0;
                    // PLL_SRC
                    if (readValueFromClockRegs('PLL_SRC') === 1) {
                        if (g_chipType === "NUC121AE" || g_chipType === "NUC1262") {
                            recordedIntputSource = sHIRC + '/2';
                        }
                        else if (g_chipType.indexOf("M25") === 0 || g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
                            recordedIntputSource = sHIRC + '/4';
                        }
                        else {
                            recordedIntputSource = sHIRC;
                        }
                    }
                    else if (readValueFromClockRegs('PLL_SRC') === 2) { // NANO103
                        recordedIntputSource = 'MIRC';
                    }
                    else if (readValueFromClockRegs('PLL_SRC') === 3) { // M251
                        recordedIntputSource = 'MIRC';
                    }
                    else if (formulaType === "M460(PLL)" && readValueFromClockRegs('PLLSRC') === 1) { // M460(PLL)
                        recordedIntputSource = sHIRC;
                    }
                    else if (formulaType === "M460(PLLFN)" && readValueFromClockRegs('PLLFNSRC') === 1) { // M460(PLLFNSRC)
                        recordedIntputSource = sHIRC;
                    }
                    else if (formulaType === "APM32E103xCxE") {
                        if (readValueFromClockRegs('PLLSRCSEL') === 0) {
                            recordedIntputSource = 'HSICLK/2';
                        }
                        if (readValueFromClockRegs('PLLHSEPSC') === 0) {
                            recordedIntputSource = 'HSECLK';
                        }
                        else {
                            recordedIntputSource = 'HSECLK/2';
                        }
                    }
                    else {
                        recordedIntputSource = sHXT;
                    }
                }
                else {
                    bSort = true;
                }

                if (formulaType === "NANO100AN_BN") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }

                        for (FB_DV = 0, maxFB_DV = Math.pow(2, 6); FB_DV < maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, 2); IN_DV < maxIN_DV; IN_DV += 1) {
                                for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 1); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                    NO = OUT_DV + 1;
                                    outputClockFreq = inputClockFreq * (FB_DV + 32) / Math.pow(2, IN_DV + 1) / NO;
                                    //test it with the constrains
                                    if (outputClockFreq >= minFCO &&
                                        outputClockFreq <= maxFCO) {
                                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                        if (calculatedinaccuracy <= inaccuracy) {
                                            if (((OUT_DV << 12) + (IN_DV << 8) + FB_DV) === recordedPLLCTL &&
                                                inputSource === recordedIntputSource) {
                                                aaDataArray.unshift([]);
                                                aaDataArray[0][0] = '';
                                                aaDataArray[0][1] = '0x' + decimalToHex((OUT_DV << 12) + (IN_DV << 8) + FB_DV, 4).toUpperCase();
                                                aaDataArray[0][2] = inputSource;
                                                aaDataArray[0][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                aaDataArray[0][4] = calculatedinaccuracy.toFixed(4) + '%';

                                            }
                                            else {
                                                aaDataArray[aaDataArray.length] = [];
                                                aaDataArray[aaDataArray.length - 1][0] = '';
                                                aaDataArray[aaDataArray.length - 1][1] = '0x' + decimalToHex((OUT_DV << 12) + (IN_DV << 8) + FB_DV, 4).toUpperCase();
                                                aaDataArray[aaDataArray.length - 1][2] = inputSource;
                                                aaDataArray[aaDataArray.length - 1][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                aaDataArray[aaDataArray.length - 1][4] = calculatedinaccuracy.toFixed(4) + '%';
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (formulaType === "NANO112_103") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else if (inputSource === 'MIRC') {
                            inputClockFreq = NUTOOL_CLOCK.g_MIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        if (NUTOOL_CLOCK.g_MIRCfrequency !== 0) { // NANO103
                            INDIV_UpperLimit = 13 - 8 + 1;
                            PLLMLP_UpperLimit = 36;
                        }
                        else { // NANO112
                            INDIV_UpperLimit = 11 - 8 + 1;
                            PLLMLP_UpperLimit = 32;
                        }
                        //FB_DV:PLL_MLP / IN_DV:PLL_SRC_N
                        for (FB_DV = 1, maxFB_DV = PLLMLP_UpperLimit; FB_DV <= maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, INDIV_UpperLimit); IN_DV < maxIN_DV; IN_DV += 1) {
                                inputClockFreq1 = inputClockFreq / (IN_DV + 1);
                                outputClockFreq = inputClockFreq1 * FB_DV;
                                //test it with the constrains
                                if (inputClockFreq1 >= minFIN &&
                                    inputClockFreq1 <= maxFIN &&
                                    outputClockFreq >= minFCO &&
                                    outputClockFreq <= maxFCO) {
                                    calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                    if (calculatedinaccuracy <= inaccuracy) {
                                        if (((IN_DV << 8) + FB_DV) === recordedPLLCTL &&
                                            inputSource === recordedIntputSource) {
                                            aaDataArray.unshift([]);
                                            aaDataArray[0][0] = '';
                                            aaDataArray[0][1] = '0x' + decimalToHex((IN_DV << 8) + FB_DV, 4).toUpperCase();
                                            aaDataArray[0][2] = inputSource;
                                            aaDataArray[0][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[0][4] = calculatedinaccuracy.toFixed(4) + '%';

                                        }
                                        else {
                                            aaDataArray[aaDataArray.length] = [];
                                            aaDataArray[aaDataArray.length - 1][0] = '';
                                            aaDataArray[aaDataArray.length - 1][1] = '0x' + decimalToHex((IN_DV << 8) + FB_DV, 4).toUpperCase();
                                            aaDataArray[aaDataArray.length - 1][2] = inputSource;
                                            aaDataArray[aaDataArray.length - 1][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[aaDataArray.length - 1][4] = calculatedinaccuracy.toFixed(4) + '%';
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (formulaType === "APM32E103xCxE") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC + '/2') {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency / 2;
                            PLLSRCSEL = 0;
                        }
                        else if (inputSource === sHXT) {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                            PLLSRCSEL = 1;
                            PLLHSEPSC = 0;
                        }
                        else { // HSECLK/2
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000 / 2; // MHz
                            PLLSRCSEL = 1;
                            PLLHSEPSC = 1;
                        }

                        PLLMLP_LowerLimit = 2;
                        PLLMLP_UpperLimit = 16;
                        for (PLLMULCFG = PLLMLP_LowerLimit; PLLMULCFG <= PLLMLP_UpperLimit; PLLMULCFG += 1) {
                            outputClockFreq = inputClockFreq * PLLMULCFG;
                            //test it with the constrains
                            if (outputClockFreq >= minFCO &&
                                outputClockFreq <= maxFCO) {
                                calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                if (calculatedinaccuracy <= inaccuracy) {
                                    if ((PLLMULCFG - 2) === readValueFromClockRegs('PLLMULCFG') &&
                                        inputSource === recordedIntputSource) {
                                        aaDataArray.unshift([]);
                                        aaDataArray[0][0] = '';
                                        aaDataArray[0][1] = '0x' + decimalToHex(((PLLMULCFG - 2) << 2) + (PLLHSEPSC << 1) + PLLSRCSEL , 4).toUpperCase();
                                        aaDataArray[0][2] = inputSource;
                                        aaDataArray[0][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                        aaDataArray[0][4] = calculatedinaccuracy.toFixed(4) + '%';

                                    }
                                    else {
                                        aaDataArray[aaDataArray.length] = [];
                                        aaDataArray[aaDataArray.length - 1][0] = '';
                                        aaDataArray[aaDataArray.length - 1][1] = '0x' + decimalToHex(((PLLMULCFG - 2) << 2) + (PLLHSEPSC << 1) + PLLSRCSEL , 4).toUpperCase();
                                        aaDataArray[aaDataArray.length - 1][2] = inputSource;
                                        aaDataArray[aaDataArray.length - 1][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                        aaDataArray[aaDataArray.length - 1][4] = calculatedinaccuracy.toFixed(4) + '%';
                                    }
                                }
                            }
                        }
                    }
                }
                else if (formulaType === "NUC400") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        if (inputClockFreq > 3200000 && inputClockFreq < 150000000) {
                            for (PLLREMAP = 0, maxPLLREMAP = Math.pow(2, 1); PLLREMAP < maxPLLREMAP; PLLREMAP += 1) {
                                for (FB_DV = 0, maxFB_DV = Math.pow(2, 9); FB_DV < maxFB_DV; FB_DV += 1) {
                                    for (IN_DV = 0, maxIN_DV = Math.pow(2, 5); IN_DV < maxIN_DV; IN_DV += 1) {
                                        for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                            switch (OUT_DV) {
                                                case 0:
                                                    NO = 1;
                                                    break;
                                                case 1:
                                                case 2:
                                                    NO = 2;
                                                    break;
                                                case 3:
                                                    NO = 4;
                                                    break;
                                                default:
                                                    break;
                                            }
                                            bPassconstrains = false;
                                            //test it with the constrains
                                            if (PLLREMAP === 0) {
                                                if (inputClockFreq / 2 / (IN_DV + 2) > 800000 &&
                                                    inputClockFreq / 2 / (IN_DV + 2) < 8000000 &&
                                                    inputClockFreq * (FB_DV + 2) / (IN_DV + 2) > 100000000 &&
                                                    inputClockFreq * (FB_DV + 2) / (IN_DV + 2) < 200000000) {
                                                    bPassconstrains = true;
                                                }
                                            }
                                            else {
                                                if (inputClockFreq / 2 / (IN_DV + 2) > 800000 &&
                                                    inputClockFreq / 2 / (IN_DV + 2) < 8000000 &&
                                                    inputClockFreq * (FB_DV + 2) / (IN_DV + 2) > 200000000 &&
                                                    inputClockFreq * (FB_DV + 2) / (IN_DV + 2) < 500000000) {
                                                    bPassconstrains = true;
                                                }
                                            }
                                            if (bPassconstrains) {
                                                outputClockFreq = inputClockFreq * (FB_DV + 2) / (IN_DV + 2) / NO;
                                                calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                                if (calculatedinaccuracy <= inaccuracy) {
                                                    if (PLLREMAP === recordedPLLREMAP &&
                                                        ((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                        inputSource === recordedIntputSource) {
                                                        aaDataArray.unshift([]);
                                                        aaDataArray[0][0] = '';
                                                        aaDataArray[0][1] = '0';
                                                        aaDataArray[0][2] = PLLREMAP;
                                                        aaDataArray[0][3] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                        aaDataArray[0][4] = inputSource;
                                                        aaDataArray[0][5] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                        aaDataArray[0][6] = calculatedinaccuracy.toFixed(4) + '%';

                                                    }
                                                    else {
                                                        aaDataArray[aaDataArray.length] = [];
                                                        aaDataArray[aaDataArray.length - 1][0] = '';
                                                        aaDataArray[aaDataArray.length - 1][1] = '0';
                                                        aaDataArray[aaDataArray.length - 1][2] = PLLREMAP;
                                                        aaDataArray[aaDataArray.length - 1][3] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                        aaDataArray[aaDataArray.length - 1][4] = inputSource;
                                                        aaDataArray[aaDataArray.length - 1][5] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                        aaDataArray[aaDataArray.length - 1][6] = calculatedinaccuracy.toFixed(4) + '%';
                                                    }
                                                }
                                            }

                                        }
                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xX';
                                aaDataArray[0][3] = '0xXXXX';
                                aaDataArray[0][4] = inputSource;
                                aaDataArray[0][5] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][6] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xX';
                                aaDataArray[aaDataArray.length - 1][3] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][4] = inputSource;
                                aaDataArray[aaDataArray.length - 1][5] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][6] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }
                else if (formulaType === "NUC505(PLL)") {
                    inputSource = FIN[0];
                    inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                    // BP === 0
                    for (FB_DV = 0, maxFB_DV = Math.pow(2, 7); FB_DV < maxFB_DV; FB_DV += 1) {
                        for (IN_DV = 0, maxIN_DV = Math.pow(2, 6); IN_DV < maxIN_DV; IN_DV += 1) {
                            for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 3); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                NO = OUT_DV + 1;
                                //test it with the constrains
                                if (inputClockFreq / (IN_DV + 1) >= minFINd2dNR &&
                                    inputClockFreq / (IN_DV + 1) <= maxFINd2dNR &&
                                    inputClockFreq * (FB_DV + 1) / (IN_DV + 1) >= minFCO &&
                                    inputClockFreq * (FB_DV + 1) / (IN_DV + 1) <= maxFCO) {
                                    outputClockFreq = inputClockFreq * (FB_DV + 1) / (IN_DV + 1) / NO;
                                    calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                    if (calculatedinaccuracy <= inaccuracy) {
                                        if (((OUT_DV << 13) + (IN_DV << 7) + FB_DV) === recordedPLLCTL &&
                                            inputSource === recordedIntputSource) {
                                            aaDataArray.unshift([]);
                                            aaDataArray[0][0] = '';
                                            aaDataArray[0][1] = '0';
                                            aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 13) + (IN_DV << 7) + FB_DV, 4).toUpperCase();
                                            aaDataArray[0][3] = inputSource;
                                            aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                        }
                                        else {
                                            aaDataArray[aaDataArray.length] = [];
                                            aaDataArray[aaDataArray.length - 1][0] = '';
                                            aaDataArray[aaDataArray.length - 1][1] = '0';
                                            aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 13) + (IN_DV << 7) + FB_DV, 4).toUpperCase();
                                            aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                            aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // BP === 1
                    outputClockFreq = inputClockFreq;
                    calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                    if (calculatedinaccuracy <= inaccuracy) {
                        if (inputSource === recordedIntputSource) {
                            aaDataArray.unshift([]);
                            aaDataArray[0][0] = '';
                            aaDataArray[0][1] = '1';
                            aaDataArray[0][2] = '0xXXXX';
                            aaDataArray[0][3] = inputSource;
                            aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                            aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                        }
                        else {
                            aaDataArray[aaDataArray.length] = [];
                            aaDataArray[aaDataArray.length - 1][0] = '';
                            aaDataArray[aaDataArray.length - 1][1] = '1';
                            aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                            aaDataArray[aaDataArray.length - 1][3] = inputSource;
                            aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                            aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                        }
                    }
                }
                else if (formulaType === "NUC505(APLL)") {
                    inputSource = FIN[0];
                    inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                    for (FB_DV = 0, maxFB_DV = Math.pow(2, 7); FB_DV < maxFB_DV; FB_DV += 1) {
                        for (IN_DV = 0, maxIN_DV = Math.pow(2, 6); IN_DV < maxIN_DV; IN_DV += 1) {
                            for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 3); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                NO = OUT_DV + 1;
                                //test it with the constrains
                                if (inputClockFreq / (IN_DV + 1) >= minFINd2dNR1 &&
                                    inputClockFreq / (IN_DV + 1) <= maxFINd2dNR1 &&
                                    inputClockFreq * (FB_DV + 1) / (IN_DV + 1) >= minFCO1 &&
                                    inputClockFreq * (FB_DV + 1) / (IN_DV + 1) <= maxFCO1) {
                                    outputClockFreq = inputClockFreq * (FB_DV + 1) / (IN_DV + 1) / NO;
                                    calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                    if (calculatedinaccuracy <= inaccuracy) {
                                        if (((OUT_DV << 13) + (FB_DV << 6) + IN_DV) === recordedPLLCTL &&
                                            inputSource === recordedIntputSource) {
                                            aaDataArray.unshift([]);
                                            aaDataArray[0][0] = '';
                                            aaDataArray[0][1] = '0x' + decimalToHex((OUT_DV << 13) + (FB_DV << 6) + IN_DV, 4).toUpperCase();
                                            aaDataArray[0][2] = inputSource;
                                            aaDataArray[0][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[0][4] = calculatedinaccuracy.toFixed(4) + '%';

                                        }
                                        else {
                                            aaDataArray[aaDataArray.length] = [];
                                            aaDataArray[aaDataArray.length - 1][0] = '';
                                            aaDataArray[aaDataArray.length - 1][1] = '0x' + decimalToHex((OUT_DV << 13) + (FB_DV << 6) + IN_DV, 4).toUpperCase();
                                            aaDataArray[aaDataArray.length - 1][2] = inputSource;
                                            aaDataArray[aaDataArray.length - 1][3] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                            aaDataArray[aaDataArray.length - 1][4] = calculatedinaccuracy.toFixed(4) + '%';
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (formulaType === "M460(PLL)") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        for (FB_DV = 0, maxFB_DV = Math.pow(2, 9); FB_DV < maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, 5); IN_DV < maxIN_DV; IN_DV += 1) {
                                for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                    switch (OUT_DV) {
                                        case 0:
                                            NO = 1;
                                            break;
                                        case 1:
                                        case 2:
                                            NO = 2;
                                            break;
                                        case 3:
                                            NO = 4;
                                            break;
                                        default:
                                            break;
                                    }
                                    //test it with the constrains
                                    if (inputClockFreq / (IN_DV + 1) >= minFINd2dNR &&  // FREF
                                        inputClockFreq / (IN_DV + 1) <= maxFINd2dNR &&  // FREF
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) >= minFCO &&  // FVCO
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) <= maxFCO) {  // FVCO
                                        outputClockFreq = inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) / NO;
                                        if (outputClockFreq >= minFOUT &&  // FOUT
                                            outputClockFreq <= maxFOUT) {  // FOUT
                                            calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                            if (calculatedinaccuracy <= inaccuracy) {
                                                if (((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                    inputSource === recordedIntputSource) {
                                                    aaDataArray.unshift([]);
                                                    aaDataArray[0][0] = '';
                                                    aaDataArray[0][1] = '0';
                                                    aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[0][3] = inputSource;
                                                    aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                                }
                                                else {
                                                    aaDataArray[aaDataArray.length] = [];
                                                    aaDataArray[aaDataArray.length - 1][0] = '';
                                                    aaDataArray[aaDataArray.length - 1][1] = '0';
                                                    aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                                    aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xXXXX';
                                aaDataArray[0][3] = inputSource;
                                aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }
                else if (formulaType === "M460(PLLFN)") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        for (FB_DV = 0, maxFB_DV = Math.pow(2, 9); FB_DV < maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, 5); IN_DV < maxIN_DV; IN_DV += 1) {
                                for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                    switch (OUT_DV) {
                                        case 0:
                                            NO = 1;
                                            break;
                                        case 1:
                                        case 2:
                                            NO = 2;
                                            break;
                                        case 3:
                                            NO = 4;
                                            break;
                                        default:
                                            break;
                                    }
                                    //test it with the constrains
                                    if (inputClockFreq / (IN_DV + 1) >= minFINd2dNR1 &&
                                        inputClockFreq / (IN_DV + 1) <= maxFINd2dNR1 &&
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) >= minFCO1 &&
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) <= maxFCO1 &&
                                        (FB_DV + 2) >= 12 && (FB_DV + 2) <= 255) {
                                        outputClockFreq = inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) / NO;
                                        if (outputClockFreq >= minFOUT1 &&
                                            outputClockFreq <= maxFOUT1) {
                                            calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                            if (calculatedinaccuracy <= inaccuracy) {
                                                if (((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                    inputSource === recordedIntputSource) {
                                                    aaDataArray.unshift([]);
                                                    aaDataArray[0][0] = '';
                                                    aaDataArray[0][1] = '0';
                                                    aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[0][3] = inputSource;
                                                    aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                                }
                                                else {
                                                    aaDataArray[aaDataArray.length] = [];
                                                    aaDataArray[aaDataArray.length - 1][0] = '';
                                                    aaDataArray[aaDataArray.length - 1][1] = '0';
                                                    aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                                    aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xXXXX';
                                aaDataArray[0][3] = inputSource;
                                aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }
                else if (formulaType === "M480") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        for (FB_DV = 0, maxFB_DV = Math.pow(2, 9); FB_DV < maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, 5); IN_DV < maxIN_DV; IN_DV += 1) {
                                for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                    switch (OUT_DV) {
                                        case 0:
                                            NO = 1;
                                            break;
                                        case 1:
                                        case 2:
                                            NO = 2;
                                            break;
                                        case 3:
                                            NO = 4;
                                            break;
                                        default:
                                            break;
                                    }
                                    //test it with the constrains
                                    if (inputClockFreq / (IN_DV + 1) >= minFINd2dNR &&
                                        inputClockFreq / (IN_DV + 1) <= maxFINd2dNR &&
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) >= minFCO &&
                                        inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) <= maxFCO) {
                                        outputClockFreq = inputClockFreq * 2 * (FB_DV + 2) / (IN_DV + 1) / NO;
                                        if (outputClockFreq >= minFOUT &&
                                            outputClockFreq <= maxFOUT) {
                                            calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                            if (calculatedinaccuracy <= inaccuracy) {
                                                if (((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                    inputSource === recordedIntputSource) {
                                                    aaDataArray.unshift([]);
                                                    aaDataArray[0][0] = '';
                                                    aaDataArray[0][1] = '0';
                                                    aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[0][3] = inputSource;
                                                    aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                                }
                                                else {
                                                    aaDataArray[aaDataArray.length] = [];
                                                    aaDataArray[aaDataArray.length - 1][0] = '';
                                                    aaDataArray[aaDataArray.length - 1][1] = '0';
                                                    aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                                    aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xXXXX';
                                aaDataArray[0][3] = inputSource;
                                aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }
                else if (formulaType === "M251") {
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === 'MIRC') {
                            inputClockFreq = NUTOOL_CLOCK.g_MIRCfrequency;
                        }
                        else if (inputSource === (sHIRC + '/4')) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency / 4;
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        for (FB_DV = 0, maxFB_DV = Math.pow(2, 6); FB_DV < maxFB_DV; FB_DV += 1) {
                            for (IN_DV = 0, maxIN_DV = Math.pow(2, 4); IN_DV < maxIN_DV; IN_DV += 1) {
                                for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                    switch (OUT_DV) {
                                        case 0:
                                            NO = 1;
                                            break;
                                        case 1:
                                            NO = 2;
                                            break;
                                        case 2:
                                        case 3:
                                            NO = 4;
                                            break;
                                        default:
                                            break;
                                    }
                                    //test it with the constraints
                                    if (IN_DV !== 0) {
                                        NR = IN_DV;
                                    }
                                    else {
                                        NR = 16;
                                    }
                                    if (FB_DV !== 0) {
                                        NF = FB_DV;
                                    }
                                    else {
                                        NF = 64;
                                    }
                                    if (inputClockFreq / NR >= minFINd2dNR &&
                                        inputClockFreq / NR <= maxFINd2dNR &&
                                        inputClockFreq * NF / NR >= minFCO &&
                                        inputClockFreq * NF / NR <= maxFCO) {
                                        outputClockFreq = inputClockFreq * NF / NR / NO;
                                        if (outputClockFreq >= minFOUT &&
                                            outputClockFreq <= maxFOUT) {
                                            calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                            if (calculatedinaccuracy <= inaccuracy) {
                                                if (((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                    inputSource === recordedIntputSource) {
                                                    aaDataArray.unshift([]);
                                                    aaDataArray[0][0] = '';
                                                    aaDataArray[0][1] = '0';
                                                    aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[0][3] = inputSource;
                                                    aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                                }
                                                else {
                                                    aaDataArray[aaDataArray.length] = [];
                                                    aaDataArray[aaDataArray.length - 1][0] = '';
                                                    aaDataArray[aaDataArray.length - 1][1] = '0';
                                                    aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                                    aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xXXXX';
                                aaDataArray[0][3] = inputSource;
                                aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }
                else { // General
                    for (i = 0, max = FIN.length; i < max; i += 1) {
                        inputSource = FIN[i];
                        if (inputSource === sHIRC) {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        else if (inputSource.indexOf(sHIRC) === 0 &&
                            inputSource.charAt(4) === '/') {
                            inputClockFreq = NUTOOL_CLOCK.g_HIRCfrequency / parseFloat(inputSource.sliceAfterX('/'));
                        }
                        else {
                            inputClockFreq = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000; // MHz
                        }
                        // BP === 0
                        if (inputClockFreq > minFIN && inputClockFreq < maxFIN) {
                            for (FB_DV = 0, maxFB_DV = Math.pow(2, 9); FB_DV < maxFB_DV; FB_DV += 1) {
                                for (IN_DV = 0, maxIN_DV = Math.pow(2, 5); IN_DV < maxIN_DV; IN_DV += 1) {
                                    for (OUT_DV = 0, maxOUT_DV = Math.pow(2, 2); OUT_DV < maxOUT_DV; OUT_DV += 1) {
                                        switch (OUT_DV) {
                                            case 0:
                                                NO = 1;
                                                break;
                                            case 1:
                                            case 2:
                                                NO = 2;
                                                break;
                                            case 3:
                                                NO = 4;
                                                break;
                                            default:
                                                break;
                                        }
                                        //test it with the constrains
                                        if (inputClockFreq / 2 / (IN_DV + 2) > minFINd2dNR &&
                                            inputClockFreq / 2 / (IN_DV + 2) < maxFINd2dNR &&
                                            inputClockFreq * (FB_DV + 2) / (IN_DV + 2) > minFCO &&
                                            inputClockFreq * (FB_DV + 2) / (IN_DV + 2) < maxFCO) {
                                            outputClockFreq = inputClockFreq * (FB_DV + 2) / (IN_DV + 2) / NO;
                                            calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                                            if (calculatedinaccuracy <= inaccuracy) {
                                                if (((OUT_DV << 14) + (IN_DV << 9) + FB_DV) === recordedPLLCTL &&
                                                    inputSource === recordedIntputSource) {
                                                    aaDataArray.unshift([]);
                                                    aaDataArray[0][0] = '';
                                                    aaDataArray[0][1] = '0';
                                                    aaDataArray[0][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[0][3] = inputSource;
                                                    aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                                                }
                                                else {
                                                    aaDataArray[aaDataArray.length] = [];
                                                    aaDataArray[aaDataArray.length - 1][0] = '';
                                                    aaDataArray[aaDataArray.length - 1][1] = '0';
                                                    aaDataArray[aaDataArray.length - 1][2] = '0x' + decimalToHex((OUT_DV << 14) + (IN_DV << 9) + FB_DV, 4).toUpperCase();
                                                    aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                                    aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                                    aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // BP === 1
                        outputClockFreq = inputClockFreq;
                        calculatedinaccuracy = Math.abs(outputClockFreq - expectationFrequency) / expectationFrequency * 100;
                        if (calculatedinaccuracy <= inaccuracy) {
                            if (inputSource === recordedIntputSource) {
                                aaDataArray.unshift([]);
                                aaDataArray[0][0] = '';
                                aaDataArray[0][1] = '1';
                                aaDataArray[0][2] = '0xXXXX';
                                aaDataArray[0][3] = inputSource;
                                aaDataArray[0][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[0][5] = calculatedinaccuracy.toFixed(4) + '%';

                            }
                            else {
                                aaDataArray[aaDataArray.length] = [];
                                aaDataArray[aaDataArray.length - 1][0] = '';
                                aaDataArray[aaDataArray.length - 1][1] = '1';
                                aaDataArray[aaDataArray.length - 1][2] = '0xXXXX';
                                aaDataArray[aaDataArray.length - 1][3] = inputSource;
                                aaDataArray[aaDataArray.length - 1][4] = (outputClockFreq / 1000000).toFixed(4) + 'MHz';
                                aaDataArray[aaDataArray.length - 1][5] = calculatedinaccuracy.toFixed(4) + '%';
                            }
                        }
                    }
                }

                if (registerName === sPLLCON) {
                    if (!$("#PLL_tableWrapper")[0]) {
                        $("<span id='PLL_tableWrapper'><table cellpadding='0' cellspacing='0' border='0' class='display' id='PLLCTLtable'></table></span>'").insertAfter($("#PD_div"));
                    }
                }
                else if (registerName === 'APLLCTL') { // APLLCTL
                    if (!$("#APLL_tableWrapper")[0]) {
                        $("<span id='APLL_tableWrapper'><table cellpadding='0' cellspacing='0' border='0' class='display' id='APLLCTLtable'></table></span>'").insertAfter($("#APD_div"));
                    }
                }
                else if (registerName === 'PLLFNCTL0') {
                    if (!$("#PLLFN_tableWrapper")[0]) {
                        $("<span id='PLLFN_tableWrapper'><table cellpadding='0' cellspacing='0' border='0' class='display' id='PLLFNCTLtable'></table></span>'").insertAfter($("#PDFN_div"));
                    }
                }

                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    sTitle_Input_inner = "输入";
                    sTitle_RealOutput_inner = "实际输出";
                    sTitle_Inaccuracy_inner = "误差率";
                    sZeroRecords_inner = "没有可用的候选者。";
                    sInfo_inner = "列出从_START_到_END_。共有_TOTAL_候选者。";
                    sInfoEmpty_inner = "列出从0到0。共0候选者。";
                    sPrevious_inner = "前一页";
                    sNext_inner = "下一页";
                    sSearch_inner = "搜寻:";
                    sClickSort_inner = "点击使得向上排序";
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    sTitle_Input_inner = "輸入";
                    sTitle_RealOutput_inner = "實際輸出";
                    sTitle_Inaccuracy_inner = "誤差率";
                    sZeroRecords_inner = "沒有可用的候選者。";
                    sInfo_inner = "列出從_START_到_END_。共有_TOTAL_候選者。";
                    sInfoEmpty_inner = "列出從0到0。共0候選者。";
                    sPrevious_inner = "前一頁";
                    sNext_inner = "下一頁";
                    sSearch_inner = "搜尋:";
                    sClickSort_inner = "點擊使得向上排序";
                }
                else {
                    sTitle_Input_inner = "Input";
                    sTitle_RealOutput_inner = "Real Output";
                    sTitle_Inaccuracy_inner = "Inaccuracy";
                    sZeroRecords_inner = "No candidate is available.";
                    sInfo_inner = "Showing _START_ to _END_ of _TOTAL_ candidates";
                    sInfoEmpty_inner = "Showing 0 to 0 of 0 candidates";
                    sPrevious_inner = "Previous";
                    sNext_inner = "Next";
                    sSearch_inner = "Search:";
                    sClickSort_inner = "Click to sort ascending";
                }

                if (formulaType === "NANO100AN_BN" || formulaType === "NANO112_103") {
                    oTable = $('#PLLCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": iDisplayLengthNumber,
                        "aaSorting": [[4, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": registerName + "[15:0]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }
                else if (formulaType === "APM32E103xCxE") {
                    oTable = $('#PLLCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": iDisplayLengthNumber,
                        "aaSorting": [[4, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": registerName + "[32:16]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }
                else if (formulaType === "NUC505(APLL)") {
                    oTable = $('#APLLCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": iDisplayLengthNumber,
                        "aaSorting": [[4, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": registerName + "[15:0]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }
                else if (formulaType === "M460(PLLFN)") {
                    oTable = $('#PLLFNCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": iDisplayLengthNumber,
                        "aaSorting": [[5, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": "BP" },
                            { "sTitle": registerName + "[15:0]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }
                else if (formulaType === "NUC400") {
                    oTable = $('#PLLCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": 4,
                        "aaSorting": [[6, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": "BP" },
                            { "sTitle": "PLLREMAP" },
                            { "sTitle": "PLLCTL[15:0]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }
                else { // the majority
                    oTable = $('#PLLCTLtable').dataTable({
                        "bPaginate": true,
                        "bLengthChange": false,
                        "bFilter": false,
                        "bSort": bSort,
                        "bInfo": true,
                        "bAutoWidth": true,
                        "iDisplayLength": iDisplayLengthNumber,
                        "aaSorting": [[5, 'asc']],
                        "pagingType": "simple",
                        "aaData": aaDataArray,
                        "aoColumns": [
                            { "sTitle": "" },
                            { "sTitle": "BP" },
                            { "sTitle": registerName + "[15:0]" },
                            { "sTitle": sTitle_Input_inner },
                            { "sTitle": sTitle_RealOutput_inner },
                            { "sTitle": sTitle_Inaccuracy_inner }
                        ],
                        "oLanguage": {
                            "sZeroRecords": sZeroRecords_inner,
                            "sInfo": sInfo_inner,
                            "sInfoEmpty": sInfoEmpty_inner,
                            "oPaginate": {
                                "sPrevious": sPrevious_inner,
                                "sNext": sNext_inner
                            },
                            "sSearch": sSearch_inner,
                            "sInfoFiltered": ""
                        },
                        "columnDefs": [
                            {
                                "orderable": false,
                                "className": 'select-checkbox',
                                "targets": 0
                            },
                            {
                                "className": "dt-center",
                                "targets": "_all"
                            }
                        ],
                        "select": {
                            "style": 'os',
                            "selector": 'td:first-child'
                        }
                    });
                }

                if (registerName === sPLLCON) {
                    // configure a click handler to the table
                    $("#PLLCTLtable tbody").delegate("tr td:first-child", "click", function (event) {
                        $(oTable.fnSettings().aoData).each(function () {
                            $(this.nTr).removeClass('row_selected');
                        });
                        $(event.target.parentNode).addClass('row_selected');

                        aTrs = oTable.fnGetNodes();

                        for (i = 0, max = aTrs.length; i < max; i++) {
                            if ($(aTrs[i]).hasClass('row_selected')) {
                                if (formulaType === "NANO100AN_BN" || formulaType === "NANO112_103") {
                                    PLLCTLvalue = aTrs[i].childNodes[1].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[2].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[3].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // OUT_DV, IN_DV, FB_DV
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                        backupValue = g_clockRegs[registerName] - backupValue;
                                        g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                    }
                                    // PLL_SRC
                                    mask = (3 << 17) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (PLL_SRCvalue === sHIRC) {
                                        g_clockRegs[registerName] = backupValue + (1 << 17) >>> 0;
                                    }
                                    else if (PLL_SRCvalue === 'MIRC') {
                                        g_clockRegs[registerName] = backupValue + (2 << 17) >>> 0;
                                    }
                                    else { // HXT
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                }
                                else if (formulaType === "APM32E103xCxE") {
                                    PLLCTLvalue = aTrs[i].childNodes[1].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[2].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[3].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // PLLMULCFG, PLLHSEPSC, PLLSRCSEL
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs[registerName] & ((Math.pow(2, 16) - 1) << 16);
                                        backupValue = g_clockRegs[registerName] - backupValue;
                                        g_clockRegs[registerName] = backupValue + (parseInt(PLLCTLvalue.slice(2), 16) << 16);
                                    }
                                }
                                else if (formulaType === "NUC400") {
                                    BPvalue = aTrs[i].childNodes[1].innerText;
                                    PLLREMAPvalue = aTrs[i].childNodes[2].innerText;
                                    PLLCTLvalue = aTrs[i].childNodes[3].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[4].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[5].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // PLLREMAP
                                    if (PLLREMAPvalue !== "0xX") {
                                        mask = (1 << 20) >>> 0;
                                        backupValue = g_clockRegs.PLLCTL & mask;
                                        backupValue = g_clockRegs.PLLCTL - backupValue;
                                        PLLREMAPvalue = parseInt(PLLREMAPvalue, 10);
                                        PLLREMAPvalue = (PLLREMAPvalue << 20) >>> 0;
                                        //window.alert(PLLREMAPvalue)
                                        g_clockRegs.PLLCTL = backupValue + PLLREMAPvalue;
                                    }
                                    // OUT_DV, IN_DV, FB_DV
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs.PLLCTL & (Math.pow(2, 16) - 1);
                                        backupValue = g_clockRegs.PLLCTL - backupValue;
                                        g_clockRegs.PLLCTL = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                    }
                                    // PLL_SRC
                                    mask = (1 << 19) >>> 0;
                                    backupValue = g_clockRegs.PLLCTL & mask;
                                    backupValue = g_clockRegs.PLLCTL - backupValue;
                                    if (PLL_SRCvalue === sHIRC) {
                                        g_clockRegs.PLLCTL = backupValue + (1 << 19) >>> 0;
                                    }
                                    else {
                                        g_clockRegs.PLLCTL = backupValue;
                                    }
                                    // BP
                                    mask = (1 << 17) >>> 0;
                                    backupValue = g_clockRegs.PLLCTL & mask;
                                    backupValue = g_clockRegs.PLLCTL - backupValue;
                                    if (BPvalue === '1') {
                                        g_clockRegs.PLLCTL = backupValue + (1 << 17) >>> 0;
                                    }
                                    else {
                                        g_clockRegs.PLLCTL = backupValue;
                                    }
                                }
                                else if (formulaType === "NUC505(PLL)") {
                                    BPvalue = aTrs[i].childNodes[1].innerText;
                                    PLLCTLvalue = aTrs[i].childNodes[2].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[3].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[4].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // OUT_DV, IN_DV, FB_DV
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                        backupValue = g_clockRegs[registerName] - backupValue;
                                        g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                    }
                                    // BP
                                    mask = (1 << 16) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (BPvalue === '1') {
                                        g_clockRegs[registerName] = backupValue + (1 << 16) >>> 0;
                                    }
                                    else {
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                }
                                else if (formulaType === "M251") {
                                    BPvalue = aTrs[i].childNodes[1].innerText;
                                    PLLCTLvalue = aTrs[i].childNodes[2].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[3].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[4].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // OUT_DV, IN_DV, FB_DV
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                        backupValue = g_clockRegs[registerName] - backupValue;
                                        g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                    }
                                    // PLL_SRC
                                    mask = (3 << 19) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (PLL_SRCvalue.indexOf(sHIRC) === 0) {
                                        g_clockRegs[registerName] = backupValue + (1 << 19) >>> 0;
                                    }
                                    else if (PLL_SRCvalue.indexOf('MIRC') === 0) {
                                        g_clockRegs[registerName] = backupValue + (3 << 19) >>> 0;
                                    }
                                    else {
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                    // BP
                                    mask = (1 << 17) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (BPvalue === '1') {
                                        g_clockRegs[registerName] = backupValue + (1 << 17) >>> 0;
                                    }
                                    else {
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                }
                                else {
                                    BPvalue = aTrs[i].childNodes[1].innerText;
                                    PLLCTLvalue = aTrs[i].childNodes[2].innerText;
                                    PLL_SRCvalue = aTrs[i].childNodes[3].innerText;
                                    g_realPLLoutputClock = aTrs[i].childNodes[4].innerText;
                                    g_realPLLoutputClock = parseFloat(g_realPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                    // OUT_DV, IN_DV, FB_DV
                                    if (PLLCTLvalue !== "0xXXXX") {
                                        backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                        backupValue = g_clockRegs[registerName] - backupValue;
                                        g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                    }
                                    // PLL_SRC
                                    mask = (1 << 19) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (PLL_SRCvalue.indexOf(sHIRC) === 0) {
                                        g_clockRegs[registerName] = backupValue + (1 << 19) >>> 0;
                                    }
                                    else {
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                    // BP
                                    mask = (1 << 17) >>> 0;
                                    backupValue = g_clockRegs[registerName] & mask;
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    if (BPvalue === '1') {
                                        g_clockRegs[registerName] = backupValue + (1 << 17) >>> 0;
                                    }
                                    else {
                                        g_clockRegs[registerName] = backupValue;
                                    }
                                }

                                updateClockRegsTree();
                                // update the real output frequency
                                $("#" + sPLL + "_span_showRealFreq").text(g_realPLLoutputClock.toHzString());
                                $("label[for='radio_PD_enable']").click();
                            }
                        }
                    });
                    // reset g_realPLLoutputClock to 0
                    g_realPLLoutputClock = 0;
                    // automatically click the first row
                    if (aaDataArray.length !== 0) {
                        $('#PLLCTLtable tbody tr:eq(0) td:eq(0)').click(); // this should be behind $("#PLLCTLtable tbody").delegate("tr", "click", function (event)
                    }
                    // to display the tooltip
                    $('#PLLCTLtable thead').each(function () {
                        this.setAttribute('title', sClickSort_inner);
                    });
                }
                else if (registerName === 'APLLCTL') { // APLLCTL
                    $("#APLLCTLtable tbody").delegate("tr", "click", function (event) {
                        $(oTable.fnSettings().aoData).each(function () {
                            $(this.nTr).removeClass('row_selected');
                        });
                        $(event.target.parentNode).addClass('row_selected');

                        aTrs = oTable.fnGetNodes();

                        for (i = 0, max = aTrs.length; i < max; i++) {
                            if ($(aTrs[i]).hasClass('row_selected')) {
                                PLLCTLvalue = aTrs[i].childNodes[1].innerText;
                                PLL_SRCvalue = aTrs[i].childNodes[2].innerText;
                                g_realAPLLoutputClock = aTrs[i].childNodes[3].innerText;
                                g_realAPLLoutputClock = parseFloat(g_realAPLLoutputClock.slicePriorToX('MHz')) * 1000000;
                                // OUT_DV, IN_DV, FB_DV
                                if (PLLCTLvalue !== "0xXXXX") {
                                    backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                }

                                updateClockRegsTree();
                                // update the real output frequency
                                $("#APLL_span_showRealFreq").text(g_realAPLLoutputClock.toHzString());
                                $("label[for='radio_APD_enable']").click();
                            }
                        }
                    });
                    // reset g_realAPLLoutputClock to 0
                    g_realAPLLoutputClock = 0;
                    // automatically click the first row
                    if (aaDataArray.length !== 0) {
                        $('#APLLCTLtable tbody tr:eq(0) td:eq(0)').click(); // this should be behind $("#APLLCTLtable tbody").delegate("tr", "click", function (event)
                    }
                    // to display the tooltip
                    $('#APLLCTLtable thead').each(function () {
                        this.setAttribute('title', sClickSort_inner);
                    });
                }
                else if (registerName === 'PLLFNCTL0') {
                    $("#PLLFNCTLtable tbody").delegate("tr", "click", function (event) {
                        $(oTable.fnSettings().aoData).each(function () {
                            $(this.nTr).removeClass('row_selected');
                        });
                        $(event.target.parentNode).addClass('row_selected');

                        aTrs = oTable.fnGetNodes();

                        for (i = 0, max = aTrs.length; i < max; i++) {
                            if ($(aTrs[i]).hasClass('row_selected')) {
                                BPvalue = aTrs[i].childNodes[1].innerText;
                                PLLCTLvalue = aTrs[i].childNodes[2].innerText;
                                PLL_SRCvalue = aTrs[i].childNodes[3].innerText;
                                g_realPLLFNoutputClock = aTrs[i].childNodes[4].innerText;
                                g_realPLLFNoutputClock = parseFloat(g_realPLLFNoutputClock.slicePriorToX('MHz')) * 1000000;
                                // OUT_DV, IN_DV, FB_DV
                                if (PLLCTLvalue !== "0xXXXX") {
                                    backupValue = g_clockRegs[registerName] & (Math.pow(2, 16) - 1);
                                    backupValue = g_clockRegs[registerName] - backupValue;
                                    g_clockRegs[registerName] = backupValue + parseInt(PLLCTLvalue.slice(2), 16);
                                }
                                // PLLFNSRC
                                mask = (1 << 31) >>> 0;
                                backupValue = Math.abs(g_clockRegs['PLLFNCTL1'] & mask);    // 不取絕對值得話會overflow
                                backupValue = g_clockRegs['PLLFNCTL1'] - backupValue;
                                if (PLL_SRCvalue.indexOf(sHIRC) === 0) {
                                    g_clockRegs['PLLFNCTL1'] = backupValue + (1 << 31) >>> 0;
                                }
                                else {
                                    g_clockRegs['PLLFNCTL1'] = backupValue;
                                }
                                // BPFN
                                mask = (1 << 29) >>> 0;
                                backupValue = g_clockRegs['PLLFNCTL1'] & mask;
                                backupValue = g_clockRegs['PLLFNCTL1'] - backupValue;
                                if (BPvalue === '1') {
                                    g_clockRegs['PLLFNCTL1'] = backupValue + (1 << 29) >>> 0;
                                }
                                else {
                                    g_clockRegs['PLLFNCTL1'] = backupValue;
                                }

                                updateClockRegsTree();
                                // update the real output frequency
                                $("#PLLFN_span_showRealFreq").text(g_realPLLFNoutputClock.toHzString());
                                $("label[for='radio_PDFN_enable']").click();
                            }
                        }
                    });
                    // reset g_realPLLFNoutputClock to 0
                    g_realPLLFNoutputClock = 0;
                    // automatically click the first row
                    if (aaDataArray.length !== 0) {
                        $('#PLLFNCTLtable tbody tr:eq(0) td:eq(0)').click(); // this should be behind $("#PLLFNCTLtable tbody").delegate("tr", "click", function (event)
                    }
                    // to display the tooltip
                    $('#PLLFNCTLtable thead').each(function () {
                        this.setAttribute('title', sClickSort_inner);
                    });
                }

                oTable.$('td').tooltip({
                    "delay": 0,
                    "track": true,
                    "fade": 0
                });
            }
        };
        calculatePLL2frequency = function (inputFrequency) {
            if (isFieldBe1(sXTL12M_EN) &&
                (parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 12 || parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 24)) {
                if (inputFrequency > 240) {
                    outputFrequency = 240;
                }
                else if (inputFrequency < 0) {
                    outputFrequency = 0;
                }
                else {
                    floorInteger = Math.floor(240 / inputFrequency - 1);
                    ceilInteger = Math.ceil(240 / inputFrequency - 1);

                    resultFromFloor = 240 / (floorInteger + 1);
                    resultFromCeil = 240 / (ceilInteger + 1);
                    if (Math.abs(inputFrequency - resultFromFloor) > Math.abs(inputFrequency - resultFromCeil)) {
                        valuePLL2_N = ceilInteger;
                        outputFrequency = resultFromCeil;
                    }
                    else {
                        valuePLL2_N = floorInteger;
                        outputFrequency = resultFromFloor;
                    }
                }
                outputFrequency = parseFloat(outputFrequency) * 1000000;

                $("#PLL2_span_showRealFreq").text(outputFrequency.toHzString());
                writeNewValueToClockRegs('PLL2DIV', valuePLL2_N);
                g_realPLL2outputClock = parseFloat($('#PLL2_span_showRealFreq').text()) * 1000000;
                g_realPLL480MoutputClock = 480 * 1000000;
            }
            else {
                $("#PLL2_span_showRealFreq").text("");
                g_realPLL2outputClock = 0;
                g_realPLL480MoutputClock = 0;
            }
        };
        add_tab_2_handler = function () {
            var m,
                maxM,
                bFound = false;

            if (!g_bPressEnter) {
                if (typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined' &&
                    isFieldBe1('PLL2CKEN') &&
                    isFieldBe1(sXTL12M_EN) &&
                    !(parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 12 || parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 24)) {
                    showAlertDialog("关於PLL2，可接受的HXT频率为12MHz和24MHz。否则，实际输出的PLL2频率会是含糊不清的。",
                        "關於PLL2，可接受的HXT頻率為12MHz和24MHz。否則，實際輸出的PLL2頻率會是含糊不清的。",
                        "For PLL2, the acceptable frequencies of HXT are 12MHz and 24MHz, or the clock of PLL2 would be ambiguous.");
                }
                else if (typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined' &&
                    isFieldBe1('PLL2CKEN') &&
                    !isFieldBe1(sXTL12M_EN)) {
                    showAlertDialog("请启用HXT，否则PLL2及PLL480M将不能工作正常。",
                        "請啟用HXT，否則PLL2及PLL480M將不能工作正常。",
                        "Please enable HXT, or PLL2 and PLL480M cannot work properly.");
                }
                else if (!isFieldBe1(sOSC10K_EN) && !isFieldBe1(sOSC22M_EN) && !isFieldBe1('HIRC1EN') && !isFieldBe1(sOSC22M2_EN) &&
                    !isFieldBe1('HIRC2EN') && !isFieldBe1('HIRC48EN') && !isFieldBe1('MIRCEN') && !isFieldBe1('MIRC1P2MEN') &&
                    !isFieldBe1(sXTL12M_EN) && !isFieldBe1(sXTL32K_EN) && !isFieldBe1('LIRC32KEN') && !isFieldBe1('PLL2CKEN')) {
                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog('请至少启用一个时脉源。');
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog('請至少啟用一個時脈源。');
                    }
                    else {
                        invokeWarningDialog('Please enable at least one clock source.');
                    }
                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sHCLK_S)) {
                        for (m = 0, maxM = NUTOOL_CLOCK.g_CLKSEL[sHCLK_S].length; m < maxM; m++) {
                            switch (NUTOOL_CLOCK.g_CLKSEL[sHCLK_S][m].slicePriorToX(':').slicePriorToX('/').toString()) {
                                case sHXT:
                                    if (isFieldBe1(sXTL12M_EN)) {
                                        bFound = true;
                                    }
                                    break;
                                case sLXT:
                                    if (isFieldBe1(sXTL32K_EN) || isFieldBe1('LIRC32KEN')) {
                                        bFound = true;
                                    }
                                    break;
                                case sPLL:
                                    if ((!isFieldBe1('PD') || isFieldBe1('PLLEN')) && g_realPLLoutputClock > 0) {
                                        bFound = true;
                                    }
                                    break;
                                case 'PLL2':
                                    if (isFieldBe1('PLL2CKEN') && g_realPLL2outputClock > 0) {
                                        bFound = true;
                                    }
                                    break;
                                case sHIRC:
                                    if (isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN')) {
                                        bFound = true;
                                    }
                                    break;
                                case sHIRC2:
                                    if (isFieldBe1(sOSC22M2_EN) || isFieldBe1('HIRC2EN')) {
                                        bFound = true;
                                    }
                                    break;
                                case sLIRC:
                                    if (isFieldBe1(sOSC10K_EN)) {
                                        bFound = true;
                                    }
                                    break;
                                default:
                                case 'MIRC':
                                    if (isFieldBe1('MIRCEN')) {
                                        bFound = true;
                                    }
                                    break;
                                case 'MIRC1P2M':
                                    if (isFieldBe1('MIRC1P2MEN')) {
                                        bFound = true;
                                    }
                                    break;
                                case 'HIRC48':
                                    if (isFieldBe1('HIRC48EN')) {
                                        bFound = true;
                                    }
                                    break;
                            }

                            if (bFound) {
                                break;
                            }
                        }
                    }

                    if (!bFound) {
                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                            invokeWarningDialog('请至少为' + sHCLK + '启用一个时脉源。');
                        }
                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                            invokeWarningDialog('請至少為' + sHCLK + '啟用一個時脈源。');
                        }
                        else {
                            invokeWarningDialog('Please enable at least one clock source for ' + sHCLK + '.');
                        }
                    }
                    else if ($('#add-tab-2').css('display') !== 'none') {
                        if (!$('#tab-3')[0]) {
                            buildHCLKandPCLKtab();
                        }
                        $("#add-tab-2").hide();
                        //if (isFieldBe1('PLL2CKEN')) {
                        //  g_realPLL2outputClock = parseFloat($('#PLL2_span_showRealFreq').text()) * 1000000;
                        //}
                        if (g_finalStep < $("#tabs").tabs('option', 'active') + 1) {
                            g_finalStep = $("#tabs").tabs('option', 'active') + 1;
                        }
                    }
                }
            }
            else {
                g_bPressEnter = false;
            }
        };
        // build the infrastructure
        removeAlldialogs();
        if (!$("#tab-3")[0]) {
            $("#tabs ul").append("<li id='li-2'><a href='#tab-2'><span id=pll_clocks_span>" + sPLL + "</span></a></li>");
            $tabs.append("<div id='tab-2'></div>");
        }
        else {
            $("<li id='li-2'><a href='#tab-2'><span id=pll_clocks_span>" + sPLL + "</span></a></li>").insertBefore("#li-3");
            $("<div id='tab-2'></div>").insertBefore("#tab-3");
        }
        $tab_2 = $("#tab-2");
        // build PLL clocks
        writeNewValueToClockRegs('PD', 1);
        writeNewValueToClockRegs('OE', 1);
        writeNewValueToClockRegs('PLLEN', 0);
        if (minFOUT !== 0 && maxFOUT !== 0) {
            buildOneSetOfClock($tab_2, 'PD', sPLL, '', 'MHz (' + minFOUT.toHzString().slicePriorToX('MHz') + '~' + maxFOUT.toHzString() + ')', false, true);
        }
        else {
            buildOneSetOfClock($tab_2, 'PD', sPLL, '', 'MHz', false, true);
        }

        if (typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined') {
            writeNewValueToClockRegs('PLL2CKEN', 0);
            buildOneSetOfClock($tab_2, 'PLL2CKEN', 'PLL2', '', 'MHz', false, false);
            if ($('#PD_div')[0]) {
                $('#PLL2CKEN_div').css('border-top', '8px solid black');
            }
        }

        if (typeof NUTOOL_CLOCK.g_register_map.APLLCTL !== 'undefined') {
            writeNewValueToClockRegs('APD', 0);
            buildOneSetOfClock($tab_2, 'APD', 'APLL', '', 'MHz', false, true);

            if ($('#PD_div')[0]) {
                $('#APD_div').css('border-top', '8px solid black');
            }
        }

        if (typeof NUTOOL_CLOCK.g_register_map.PLLFNCTL1 !== 'undefined') {
            writeNewValueToClockRegs('PDFN', 1);
            writeNewValueToClockRegs('OEFN', 1);
            if (minFOUT1 !== 0 && maxFOUT1 !== 0) {
                buildOneSetOfClock($tab_2, 'PDFN', 'PLLFN', '', 'MHz (' + minFOUT.toHzString().slicePriorToX('MHz') + '~' + maxFOUT.toHzString() + ')', false, true);
            }
            else {
                buildOneSetOfClock($tab_2, 'PDFN', 'PLLFN', '', 'MHz', false, true);
            }

            if ($('#PD_div')[0]) {
                $('#PDFN_div').css('border-top', '8px solid black');
            }
        }

        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $tab_2[0].appendChild(ce("button", "add-tab-2", "下一步"));
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $tab_2[0].appendChild(ce("button", "add-tab-2", "下一步"));
        }
        else {
            $tab_2[0].appendChild(ce("button", "add-tab-2", "Next Step"));
        }
        $("#add-tab-2").addClass("css_btn_class");
        g_utility.addEvent($("#add-tab-2")[0], "click", add_tab_2_handler);
        $tabs.tabs("refresh");
        $tabs.tabs({ active: 1 });

        // adjust the size of the relevant UI elements
        if ($('#clockRegsTree').css('display') !== 'none') {
            $tabs.css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
        }
        else {
            $tabs.css('width', (g_Dialog_Width - 8) + 'px');
        }
        $tabs.css('height', (g_Dialog_Height - 8) + 'px');
        $('#tab-2').css('height', (g_Dialog_Height - 8) + 'px');

        // radio button handlers
        $(".cb-enable").click(function () {
            //window.alert('enable')
            currentHtmlFor = this.htmlFor;
            if (currentHtmlFor.indexOf('PD') !== -1 || currentHtmlFor.indexOf('PLL2CKEN') !== -1) {
                parent = $(this).parents('.switch');
                $('.cb-disable', parent).removeClass('selected');
                $(this).addClass('selected');
                $('.checkbox', parent).attr('checked', true);

                if (currentHtmlFor.indexOf('PLL2CKEN') !== -1) {
                    writeNewValueToClockRegs('PLL2CKEN', 1);

                    if (g_realPLL2outputClock === 0 &&
                        isFieldBe1(sXTL12M_EN) &&
                        (parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 12 || parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 24)) {
                        $("#PLL2CKEN_input").change();
                    }
                    else if (!isFieldBe1(sXTL12M_EN) ||
                        !(parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 12 || parseInt($('#' + sXTL12M_EN + '_input').val(), 10) === 24)) {
                        showAlertDialog("关於PLL2，可接受的HXT频率为12MHz和24MHz。否则，实际输出的PLL2频率会是含糊不清的。",
                            "關於PLL2，可接受的HXT頻率為12MHz和24MHz。否則，實際輸出的PLL2頻率會是含糊不清的。",
                            "For PLL2, the acceptable frequencies of HXT are 12MHz and 24MHz, or the clock of PLL2 would be ambiguous.");
                        $("#PLL2CKEN_input").change();
                    }
                }
                else if (currentHtmlFor.indexOf('APD') !== -1) {
                    if (g_realAPLLoutputClock === 0) {
                        $("#APD_input").change();
                    }
                    writeNewValueToClockRegs('APD', 0);
                }
                else if (currentHtmlFor.indexOf('PDFN') !== -1) {
                    if (g_realPLLFNoutputClock === 0) {
                        $("#PDFN_input").change();
                    }
                    writeNewValueToClockRegs('PDFN', 0);
                    writeNewValueToClockRegs('OEFN', 0);
                }
                else { // PLL
                    if (g_realPLLoutputClock === 0) {
                        $("#PD_input").change();
                    }
                    writeNewValueToClockRegs('PD', 0);
                    writeNewValueToClockRegs('OE', 0);
                    writeNewValueToClockRegs('PLLEN', 1);
                }

                currentHtmlFor = currentHtmlFor.sliceBetweenXandX('radio_', '_enable');
                if (currentHtmlFor.indexOf('APD') !== -1) {
                    $(".APLL_" + currentHtmlFor + "_p").css('color', 'black');
                }
                else if (currentHtmlFor.indexOf('PDFN') !== -1) {   // PLLFN
                    $(".PLLFN_" + currentHtmlFor + "_p").css('color', 'black');
                }
                else { // PLL
                    $(".PLL_" + currentHtmlFor + "_p").css('color', 'black');
                }
                triggerMultiWayConfigure();
            }
        });
        $(".cb-disable").click(function () {
            //window.alert('disable')
            currentHtmlFor = this.htmlFor;
            if (currentHtmlFor.indexOf('PD') !== -1 || currentHtmlFor.indexOf('PLL2CKEN') !== -1) {
                parent = $(this).parents('.switch');
                $('.cb-enable', parent).removeClass('selected');
                $(this).addClass('selected');
                $('.checkbox', parent).attr('checked', false);

                if (currentHtmlFor.indexOf('PLL2CKEN') !== -1) {
                    writeNewValueToClockRegs('PLL2CKEN', 0);
                    g_realPLL2outputClock = 0;
                    g_realPLL480MoutputClock = 0;
                    $("#PLL2_span_showRealFreq").text("");
                }
                else if (currentHtmlFor.indexOf('APD') !== -1) {
                    writeNewValueToClockRegs('APD', 1);
                    // do not forget the useless table
                    $('#APLLCTLtable').dataTable().fnDestroy();
                    $("#APLL_tableWrapper").remove();
                    $("#APLL_span_showRealFreq").text("");
                    g_realAPLLoutputClock = 0;
                }
                else if (currentHtmlFor.indexOf('PDFN') !== -1) {
                    writeNewValueToClockRegs('PDFN', 1);
                    writeNewValueToClockRegs('OEFN', 1);
                    // do not forget the useless table
                    $('#PLLFNCTLtable').dataTable().fnDestroy();
                    $("#PLLFN_tableWrapper").remove();
                    $("#PLLFN_span_showRealFreq").text("");
                    g_realPLLFNoutputClock = 0;
                }
                else { // PLL case
                    writeNewValueToClockRegs('PD', 1);
                    writeNewValueToClockRegs('OE', 1);
                    writeNewValueToClockRegs('PLLEN', 0);
                    // do not forget the useless table
                    $('#PLLCTLtable').dataTable().fnDestroy();
                    $("#PLL_tableWrapper").remove();
                    $("#" + sPLL + "_span_showRealFreq").text("");
                    g_realPLLoutputClock = 0;
                }

                currentHtmlFor = currentHtmlFor.sliceBetweenXandX('radio_', '_disable');
                if (currentHtmlFor.indexOf('APD') !== -1) {
                    $(".APLL_" + currentHtmlFor + "_p").css('color', '#BC8484');
                }
                else if (currentHtmlFor.indexOf('PDFN') !== -1) {
                    $(".PLLFN_" + currentHtmlFor + "_p").css('color', '#BC8484');
                }
                else { // PLL
                    $(".PLL_" + currentHtmlFor + "_p").css('color', '#BC8484');
                }
                triggerMultiWayConfigure();
            }
        });
        // input change handlers
        $("#PD_input").change(function () {
            if (typeof (this.value) !== 'undefined' && this.value !== '' && (/^\d*\.?\d*$/.test(this.value))) {
                buildPLLCTLtable(this.value, false, $("#" + sPLL + "_inaccuracy_select").val(), sPLLCON);
            }
            else {
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                }
                else {
                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                }
            }
        });
        $("#PLL2CKEN_input").change(function () {
            if (typeof (this.value) !== 'undefined' && this.value !== '' && parseInt(this.value, 10) > 0 && (/^\d*\.?\d*$/.test(this.value))) {
                calculatePLL2frequency(this.value);
                if ($("#PLL2_span_showRealFreq").text() !== "") {
                    $("label[for='radio_PLL2CKEN_enable']").click();
                }
                else {
                    $("label[for='radio_PLL2CKEN_disable']").click();
                }
            }
            else {
                $("#PLL2CKEN_input").val('');
                $("label[for='radio_PLL2CKEN_disable']").click();
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                }
                else {
                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                }
            }
        });
        $("#APD_input").change(function () {
            if (typeof (this.value) !== 'undefined' && this.value !== '' && (/^\d*\.?\d*$/.test(this.value))) {
                //window.alert(this.value)
                buildPLLCTLtable(this.value, false, $("#APLL_inaccuracy_select").val(), 'APLLCTL');
            }
            else {
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                }
                else {
                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                }
            }
        });
        $("#PDFN_input").change(function () {
            if (typeof (this.value) !== 'undefined' && this.value !== '' && (/^\d*\.?\d*$/.test(this.value))) {
                //window.alert(this.value)
                buildPLLCTLtable(this.value, false, $("#PLLFN_inaccuracy_select").val(), 'PLLFNCTL0');
            }
            else {
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('所输入的内容是不正确的。请再试一次。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('所輸入的內容是不正確的。請再試一次。');
                }
                else {
                    invokeWarningDialog('The inputted content is incorrect. Please try again.');
                }
            }
        });
        // initialization
        if ((isFieldBe1(sXTL12M_EN) || isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN') || isFieldBe1(sOSC22M2_EN) ||
            isFieldBe1('HIRC2EN') || isFieldBe1('HIRC48EN') || isFieldBe1('MIRCEN')) &&
            (g_realPLLoutputClock > 0 || g_realAPLLoutputClock > 0 || g_realPLLFNoutputClock > 0 || g_finalStep === 1 || typeof NUTOOL_PER !== 'undefined')) {
            if (g_finalStep === 1 && g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = localRealPLLoutputClock;
            }
            if (g_finalStep === 1 && g_realAPLLoutputClock === 0) {
                g_realAPLLoutputClock = localRealAPLLoutputClock;
            }
            if (g_finalStep === 1 && g_realPLLFNoutputClock === 0) {
                g_realPLLFNoutputClock = localRealPLLFNoutputClock;
            }
            if (g_realPLLoutputClock > 0) {
                $("#PD_input").val(g_realPLLoutputClock / 1000000);
                buildPLLCTLtable(g_realPLLoutputClock / 1000000, true, $("#" + sPLL + "_inaccuracy_select").val(), sPLLCON);
            }
            if (g_realAPLLoutputClock > 0) {
                $("#APD_input").val(g_realAPLLoutputClock / 1000000);
                buildPLLCTLtable(g_realAPLLoutputClock / 1000000, true, $("#APLL_inaccuracy_select").val(), 'APLLCTL');
            }
            if (g_realPLLFNoutputClock > 0) {
                $("#PDFN_input").val(g_realPLLFNoutputClock / 1000000);
                buildPLLCTLtable(g_realPLLFNoutputClock / 1000000, true, $("#PLLFN_inaccuracy_select").val(), 'PLLFNCTL0');
            }
        }
        else {
            g_realPLLoutputClock = 0;
            g_realAPLLoutputClock = 0;
            g_realPLLFNoutputClock = 0;
        }

        if (isFieldBe1(sXTL12M_EN) &&
            ($('#' + sXTL12M_EN + '_input').val() === '12' || $('#' + sXTL12M_EN + '_input').val() === '24') &&
            (g_realPLL2outputClock > 0 || g_finalStep === 1)) {
            if (g_finalStep === 1 && g_realPLL2outputClock === 0) {
                g_realPLL2outputClock = localRealPLL2outputClock;
            }
            $("#PLL2CKEN_input").val(g_realPLL2outputClock / 1000000);
            $("#PLL2CKEN_input").change();
        }
        else {
            g_realPLL2outputClock = 0;
            g_realPLL480MoutputClock = 0;
        }

        if (command !== 'single' && g_finalStep > 2) {
            if (isFieldBe1(sOSC10K_EN) || isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN') || isFieldBe1(sOSC22M2_EN) ||
                isFieldBe1('HIRC2EN') || isFieldBe1('HIRC48EN') ||
                isFieldBe1('MIRCEN') || isFieldBe1('MIRC1P2MEN') || isFieldBe1(sXTL12M_EN) || isFieldBe1(sXTL32K_EN) ||
                isFieldBe1('LIRC32KEN') || isFieldBe1('PLL2CKEN') /*|| !isFieldBe1('PD')*/) {
                add_tab_2_handler();
            }
        }
        if ($("#tab-3")[0]) {
            $("#add-tab-2").hide();
        }
    }

    function buildRefClockTab(command) {
        var i,
            max,
            j,
            maxJ,
            $tabs = $("#tabs"),
            $tab_1,
            appendElementString,
            parent,
            currentHtmlFor,
            buildOneSetOfClock,
            selectFieldValue = "",
            opt,
            add_tab_1_handler,
            chainEffectHandler,
            chainEffectHandler2,
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sHXTWAIT = 'HXTWAIT'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sPWRCON = 'PWRCON'.toEquivalent().toString(),
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            bNeedHandleChainEffect = false,
            bNeedHandleChainEffect1 = false,
            bNeedHandleChainEffect2 = false,
            bNeedHandleChainEffect3 = false,
            bNeedHandleChainEffect4 = false;

        buildOneSetOfClock = function (hostDiv, enableField, name, defaultValue, unitHz, controlType, bEnable) {
            if (controlType === "input") {
                if (bEnable) {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + "</p></div><br />";
                }
                else {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable selected'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + "</p></div><br />";
                }
            }
            else if (controlType === "input_select") {
                if (bEnable) {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + " <span class=wait_span>Wait</span>:</p><select id='" + enableField + "_select' title='Select the expected value' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'><span class=cycles_span>cycles</span></p></div><br />";
                }
                else {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable selected'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><input id='" + enableField + "_input' title='Input the expected value' type='text' value='" + defaultValue + "' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + " <span class=wait_span>Wait</span>:</p><select id='" + enableField + "_select' title='Select the expected value' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'><span class=cycles_span>cycles</span></p></div><br />";
                }
            }
            else if (controlType === "select") {
                if (bEnable) {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><select id='" + enableField + "_select' title='Select the expected value' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + "</p></div><br />";
                }
                else {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable selected'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + "</p><select id='" + enableField + "_select' title='Select the expected value' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>" + unitHz + "</p></div><br />";
                }
            }
            else if (controlType === "text") {
                if (bEnable) {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable selected'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable'><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + defaultValue + unitHz + "</p></div><br />";
                }
                else {
                    appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class='field switch div_clock_composite'><input type='radio' id='radio_" + enableField + "_enable' name='field' checked/><input type='radio' id='radio_" + enableField + "_disable' name='field'/><label for='radio_" + enableField + "_enable' class='cb-enable'><span class=enable_span>Enable</span></label><label for='radio_" + enableField + "_disable' class='cb-disable' selected><span class=disable_span>Disable</span></label></p><p style='text-indent: 1em;' class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + defaultValue + unitHz + "</p></div><br />";
                }
            }
            else if (controlType === "alwaysEnabled") {
                appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class = 'ref_" + enableField + "_p div_clock_composite'>" + name + ": " + defaultValue + unitHz + "</p></div><br />";
            }
            else if (controlType === "RTC32k") {
                appendElementString = "<br /><div id='ref_" + enableField + "_div'><p class = 'ref_" + enableField + "_p div_clock_composite'>" + name + "(from " + "</p><select id='" + enableField + "_select' title='Select a clock source' class = 'div_clock_composite'/><p class = 'ref_" + enableField + "_p div_clock_composite'>): 32.768" + unitHz + "</p></div><br />";
            }
            hostDiv.append(appendElementString);
        };
        add_tab_1_handler = function () {
            if (!g_bPressEnter) {
                if (isFieldBe1(sOSC10K_EN) || isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN') || isFieldBe1(sOSC22M2_EN) ||
                    isFieldBe1('HIRC2EN') || isFieldBe1('HIRC48EN') ||
                    isFieldBe1('MIRCEN') || isFieldBe1('MIRC1P2MEN') ||
                    isFieldBe1(sXTL12M_EN) || isFieldBe1(sXTL32K_EN) || isFieldBe1('LIRC32KEN')) {
                    if ($('#add-tab-1').css('display') !== 'none') {

                        if (!$('#tab-2')[0] && typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
                            buildPLLclockTab();
                        }
                        else if (!$('#tab-3')[0]) {
                            buildHCLKandPCLKtab();
                        }

                        if (g_finalStep < $("#tabs").tabs('option', 'active') + 1) {
                            g_finalStep = $("#tabs").tabs('option', 'active') + 1;
                        }

                        $("#add-tab-1").hide();
                        if (isFieldBe1(sOSC10K_EN)) {
                            g_realLIRCoutputClock = NUTOOL_CLOCK.g_LIRCfrequency;
                        }
                        if (isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN')) {
                            g_realHIRCoutputClock = NUTOOL_CLOCK.g_HIRCfrequency;
                        }
                        if (isFieldBe1(sOSC22M2_EN) || isFieldBe1('HIRC2EN')) {
                            g_realHIRC2outputClock = NUTOOL_CLOCK.g_HIRC2frequency;
                        }
                        if (isFieldBe1('HIRC48EN')) {
                            g_realHIRC48outputClock = NUTOOL_CLOCK.g_HIRC48frequency;
                        }
                        if (isFieldBe1('MIRCEN')) {
                            g_realMIRCoutputClock = NUTOOL_CLOCK.g_MIRCfrequency;
                        }
                        if (isFieldBe1('MIRC1P2MEN')) {
                            g_realMIRC1P2MoutputClock = NUTOOL_CLOCK.g_MIRC1P2Mfrequency;
                        }
                        if (isFieldBe1(sXTL32K_EN)) {
                            g_realLXToutputClock = 32768;
                        }
                        if (isFieldBe1('LIRC32KEN')) {
                            g_realLXToutputClock = 32000;
                        }
                        if (isFieldBe1(sXTL12M_EN)) {
                            g_realHXToutputClock = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000;
                        }
                        if (NUTOOL_CLOCK.g_RTC32kfrequency !== 0) {
                            g_realRTC32koutputClock = NUTOOL_CLOCK.g_RTC32kfrequency;
                        }
                    }
                }
                else {
                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog('请至少启用一个时脉源。');
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog('請至少啟用一個時脈源。');
                    }
                    else {
                        invokeWarningDialog('Please enable at least one clock source.');
                    }
                }
            }
            else {
                g_bPressEnter = false;
            }
        };
        chainEffectHandler = function () {
            var selectorNames = getPropertyNames(NUTOOL_CLOCK.g_CLKSEL),
                exclusiveSource = "",
                replacedSource = "";

            if (isFieldBe1(sXTL32K_EN)) {
                exclusiveSource = "LXT";
                replacedSource = sHXT;
            }
            else {
                exclusiveSource = sHXT;
                replacedSource = "LXT";
            }

            for (i = 0, max = selectorNames.length; i < max; i += 1) {
                for (j = 0, maxJ = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].length; j < maxJ; j += 1) {
                    if (NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf(replacedSource) !== -1) {
                        if (NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf('HXTorLXT') !== -1) {
                            NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j] = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].replace('HXTorLXT', exclusiveSource);
                        }
                        else {
                            NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j] = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].replace(replacedSource, exclusiveSource);
                        }
                    }
                }
            }
        };
        chainEffectHandler2 = function () {
            if (isFieldBe1(sXTL32K_EN)) {
                NUTOOL_CLOCK.g_Module.RTC[0] = sLXT;
            }
            else {
                NUTOOL_CLOCK.g_Module.RTC[0] = sLIRC;
            }
        };

        // build the infrastructure
        removeAlldialogs();
        $tabs[0].setAttribute('style', 'border: 1px solid white; position:absolute; margin-top: 55px; left:' + (g_NUC_TreeView_Width + 8) + 'px; top:0px;');

        if (!$("#tab-2")[0] && !$("#tab-3")[0]) {
            $("#tabs ul").append("<li id='li-1'><a href='#tab-1'><span id=base_clocks_span>Base Clocks</span></a></li>");
            $("#tabs").append("<div id='tab-1'></div>");
        }
        else if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
            $("<li id='li-1'><a href='#tab-1'>Base Clocks</a></li>").insertBefore("#li-2");
            $("<div id='tab-1'></div>").insertBefore("#tab-2");
        }
        else {
            $("<li id='li-1'><a href='#tab-1'>Base Clocks</a></li>").insertBefore("#li-3");
            $("<div id='tab-1'></div>").insertBefore("#tab-3");
        }
        $tab_1 = $("#tab-1");
        // build Base Clocks
        if (NUTOOL_CLOCK.g_LIRCfrequency !== 0) {
            if (checkForField(sOSC10K_EN + ':')) {
                buildOneSetOfClock($tab_1, sOSC10K_EN, sLIRC, NUTOOL_CLOCK.g_LIRCfrequency / 1000, 'kHz', 'text', true);
            }
            else {
                buildOneSetOfClock($tab_1, sOSC10K_EN, sLIRC, NUTOOL_CLOCK.g_LIRCfrequency / 1000, 'kHz', 'alwaysEnabled', true);
            }
        }
        if (NUTOOL_CLOCK.g_HIRCfrequency !== 0) {
            if (NUTOOL_CLOCK.g_HIRCfrequencyArray.length === 0) {
                if (checkForField(sOSC22M_EN + ':')) {
                    buildOneSetOfClock($tab_1, sOSC22M_EN, sHIRC, NUTOOL_CLOCK.g_HIRCfrequency / 1000000, 'MHz', 'text', true);
                }
                else {
                    buildOneSetOfClock($tab_1, sOSC22M_EN, sHIRC, NUTOOL_CLOCK.g_HIRCfrequency / 1000000, 'MHz', 'alwaysEnabled', true);
                }
            }
            else {
                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('HIRCSEL')) {
                    buildOneSetOfClock($tab_1, sOSC22M_EN, 'HIRC0', 0, 'MHz', 'select', true);
                    buildOneSetOfClock($tab_1, 'HIRC1EN', 'HIRC1', 36, 'MHz', 'text', true);
                }
                else {
                    buildOneSetOfClock($tab_1, sOSC22M_EN, sHIRC, 0, 'MHz', 'select', true);
                }

                for (i = 0, max = NUTOOL_CLOCK.g_HIRCfrequencyArray.length; i < max; i += 1) {
                    opt = window.document.createElement("option");
                    try { opt.id = opt.innerHTML = opt.value = NUTOOL_CLOCK.g_HIRCfrequencyArray[i] / 1000000; } catch (err) { }
                    $("#" + sOSC22M_EN + "_select")[0].appendChild(opt);
                }

                if (isFieldBe1('HIRC_FSEL')) {
                    $("#" + sOSC22M_EN + "_select").val(16);
                }
                else {
                    $("#" + sOSC22M_EN + "_select").val(12);
                }
                $("#" + sOSC22M_EN + "_select").on('change', function () {
                    if ($(this).val() === "16") {
                        writeNewValueToClockRegs('HIRC_FSEL', 1);
                    }
                    else {
                        writeNewValueToClockRegs('HIRC_FSEL', 0);
                    }

                    if (isFieldBe1(sOSC22M_EN)) {
                        NUTOOL_CLOCK.g_HIRCfrequency = parseInt($(this).val() * 1000000, 10);
                        triggerMultiWayConfigure();
                    }
                });
            }
        }
        if (NUTOOL_CLOCK.g_HIRC2frequency !== 0) {
            if (NUTOOL_CLOCK.g_HIRC2frequencyArray.length === 0) {
                if (checkForField(sOSC22M2_EN + ':')) {
                    buildOneSetOfClock($tab_1, sOSC22M2_EN, sHIRC2, NUTOOL_CLOCK.g_HIRC2frequency / 1000000, 'MHz', 'text', true);
                }
                else {
                    buildOneSetOfClock($tab_1, sOSC22M2_EN, sHIRC2, NUTOOL_CLOCK.g_HIRC2frequency / 1000000, 'MHz', 'alwaysEnabled', true);
                }
            }
            else {
                buildOneSetOfClock($tab_1, sOSC22M2_EN, sHIRC2, 0, 'MHz', 'select', true);

                for (i = 0, max = NUTOOL_CLOCK.g_HIRC2frequencyArray.length; i < max; i += 1) {
                    opt = window.document.createElement("option");
                    try { opt.id = opt.innerHTML = opt.value = NUTOOL_CLOCK.g_HIRC2frequencyArray[i] / 1000000; } catch (err) { }
                    $("#" + sOSC22M2_EN + "_select")[0].appendChild(opt);
                }

                if (isFieldBe1('HIRC_FSEL')) {
                    $("#" + sOSC22M2_EN + "_select").val(16);
                }
                else {
                    $("#" + sOSC22M2_EN + "_select").val(12);
                }
                $("#" + sOSC22M2_EN + "_select").on('change', function () {
                    if ($(this).val() === "16") {
                        writeNewValueToClockRegs('HIRC_FSEL', 1);
                    }
                    else {
                        writeNewValueToClockRegs('HIRC_FSEL', 0);
                    }

                    if (isFieldBe1(sOSC22M2_EN)) {
                        NUTOOL_CLOCK.g_HIRC2frequency = parseInt($(this).val() * 1000000, 10);
                        triggerMultiWayConfigure();
                    }
                });
            }
        }
        if (NUTOOL_CLOCK.g_HIRC48frequency !== 0) {
            buildOneSetOfClock($tab_1, 'HIRC48EN', 'HIRC48', NUTOOL_CLOCK.g_HIRC48frequency / 1000000, 'MHz', 'text', true);
        }
        if (NUTOOL_CLOCK.g_MIRCfrequency !== 0) {
            buildOneSetOfClock($tab_1, 'MIRCEN', 'MIRC', NUTOOL_CLOCK.g_MIRCfrequency / 1000000, 'MHz', 'text', true);
        }
        if (NUTOOL_CLOCK.g_MIRC1P2Mfrequency !== 0) {
            if (_.filter(NUTOOL_CLOCK.g_register_map[sPWRCON], function (s) { return s.indexOf('MIRC1P2MEN:') !== -1; }).length !== 0) {
                buildOneSetOfClock($tab_1, 'MIRC1P2MEN', 'MIRC1P2M', NUTOOL_CLOCK.g_MIRC1P2Mfrequency / 1000000, 'MHz', 'text', true);
            }
            else {
                buildOneSetOfClock($tab_1, 'MIRC1P2MEN', 'MIRC1P2M', NUTOOL_CLOCK.g_MIRC1P2Mfrequency / 1000000, 'MHz', 'alwaysEnabled', true);
            }
        }
        // Some chips do not have LXT as the base clock
        if (checkForField(sXTL32K_EN + ':')) {
            buildOneSetOfClock($tab_1, sXTL32K_EN, sLXT, '32.768', 'kHz', 'text', true);
        }
        if (readValueFromClockRegs('LIRC32KEN') !== -1) {
            buildOneSetOfClock($tab_1, 'LIRC32KEN', 'LIRC32K', '32', 'kHz', 'text', true);
        }
        if (NUTOOL_CLOCK.g_RTC32kfrequency !== 0) {
            buildOneSetOfClock($tab_1, 'RTC32kEN', 'RTC32k', NUTOOL_CLOCK.g_RTC32kfrequency / 1000, 'kHz', 'RTC32k', true);

            opt = window.document.createElement("option");
            try { opt.id = opt.innerHTML = opt.value = sLXT; } catch (err) { }
            $("#RTC32kEN_select")[0].appendChild(opt);
            opt = window.document.createElement("option");
            try { opt.id = opt.innerHTML = opt.value = sLIRC; } catch (err) { }
            $("#RTC32kEN_select")[0].appendChild(opt);

            if (isFieldBe1('RTCSEL')) {
                $("#RTC32kEN_select").val(sLIRC);
            }
            else {
                $("#RTC32kEN_select").val(sLXT);
            }

            $("#RTC32kEN_select").on('change', function () {
                if ($(this).val() === sLIRC) {
                    writeNewValueToClockRegs('RTCSEL', 1);
                }
                else {
                    writeNewValueToClockRegs('RTCSEL', 0);
                }
            });
        }
        if (checkForField(sXTL12M_EN + ':')) {
            if (g_realHXToutputClock > 0) {
                buildOneSetOfClock($tab_1, sXTL12M_EN, sHXT, g_realHXToutputClock / 1000000, 'MHz (' + NUTOOL_CLOCK.g_HXTRange + ')', 'input', true);
            }
            else {
                buildOneSetOfClock($tab_1, sXTL12M_EN, sHXT, NUTOOL_CLOCK.g_HXTfrequency / 1000000, 'MHz (' + NUTOOL_CLOCK.g_HXTRange + ')', 'input', true);
            }
        }
        $tab_1.append("<br />");
        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $tab_1[0].appendChild(ce("button", "add-tab-1", "下一步"));
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $tab_1[0].appendChild(ce("button", "add-tab-1", "下一步"));
        }
        else {
            $tab_1[0].appendChild(ce("button", "add-tab-1", "Next Step"));
        }
        $("#add-tab-1").addClass("css_btn_class");
        g_utility.addEvent($("#add-tab-1")[0], "click", add_tab_1_handler);
        $tabs.tabs({ heightStyle: "auto" });
        $tabs.tabs("refresh");

        // tab click handler
        $tabs.tabs({
            activate: function () {
                // record the current config for the use of multi-way configure
                saveCurrentConfig();
                if (g_svgGroup === null) {
                    $("#searchModule").hide();
                }
                else if ($('#clockRegsTree').css('display') !== 'none') {
                    $("#searchModule").show();
                }
            }
        });

        // base radio button handlers
        $(".cb-enable").click(function () {
            currentHtmlFor = this.htmlFor;
            parent = $(this).parents('.switch');
            $('.cb-disable', parent).removeClass('selected');
            $(this).addClass('selected');
            $('.checkbox', parent).attr('checked', true);

            if ($("#" + sXTL12M_EN + "_input").val() === "") {
                $("#" + sXTL12M_EN + "_input").val(NUTOOL_CLOCK.g_HXTfrequency / 1000000);
            }
            currentHtmlFor = currentHtmlFor.sliceBetweenXandX('radio_', '_enable');
            $(".ref_" + currentHtmlFor + "_p").css('color', 'black');

            writeNewValueToClockRegs(currentHtmlFor, 1);

            // chain effect
            if (bNeedHandleChainEffect) {
                if (currentHtmlFor.indexOf(sXTL12M_EN) === 0) {
                    parent = $("label[for='radio_" + sXTL32K_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sXTL32K_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sXTL32K_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sXTL32K_EN, 0);
                }
                else if (currentHtmlFor.indexOf(sXTL32K_EN) === 0) {
                    parent = $("label[for='radio_" + sXTL12M_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sXTL12M_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sXTL12M_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sXTL12M_EN, 0);
                }

                chainEffectHandler();
            }
            else if (bNeedHandleChainEffect1) {
                if (currentHtmlFor.indexOf(sOSC22M_EN) === 0) { // HIRC0
                    parent = $("label[for='radio_HIRC1EN_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_HIRC1EN_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_HIRC1EN_p").css('color', '#BC8484');

                    writeNewValueToClockRegs('HIRC1EN', 0);
                    writeNewValueToClockRegs('HIRCSEL', 0);

                    if (isFieldBe1('HIRC_FSEL')) {
                        NUTOOL_CLOCK.g_HIRCfrequency = 16 * 1000000;
                    }
                    else {
                        NUTOOL_CLOCK.g_HIRCfrequency = 12 * 1000000;
                    }
                }
                else if (currentHtmlFor.indexOf('HIRC1EN') === 0) { // HIRC1
                    parent = $("label[for='radio_" + sOSC22M_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sOSC22M_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sOSC22M_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sOSC22M_EN, 0);
                    writeNewValueToClockRegs('HIRCSEL', 1);

                    NUTOOL_CLOCK.g_HIRCfrequency = 36 * 1000000;
                }
            }
            else if (bNeedHandleChainEffect2 && currentHtmlFor.indexOf(sXTL32K_EN) === 0) {
                chainEffectHandler2();
            }
            else if (bNeedHandleChainEffect3) {
                if (currentHtmlFor.indexOf(sXTL12M_EN) === 0) {
                    parent = $("label[for='radio_" + sXTL32K_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sXTL32K_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sXTL32K_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sXTL32K_EN, 0);
                }
                else if (currentHtmlFor.indexOf(sXTL32K_EN) === 0) {
                    parent = $("label[for='radio_" + sXTL12M_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sXTL12M_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sXTL12M_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sXTL12M_EN, 0);
                }
            }
            else if (bNeedHandleChainEffect4) {
                if (currentHtmlFor.indexOf(sXTL32K_EN) === 0) {
                    parent = $("label[for='radio_LIRC32KEN_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_LIRC32KEN_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_LIRC32KEN_p").css('color', '#BC8484');

                    writeNewValueToClockRegs('LIRC32KEN', 0);
                    writeNewValueToClockRegs('C32KS', 0);
                }
                else if (currentHtmlFor.indexOf('LIRC32KEN') === 0) {
                    parent = $("label[for='radio_" + sXTL32K_EN + "_disable']").parents('.switch');
                    $('.cb-enable', parent).removeClass('selected');
                    $("label[for='radio_" + sXTL32K_EN + "_disable']").addClass('selected');
                    $('.checkbox', parent).attr('checked', false);
                    $(".ref_" + sXTL32K_EN + "_p").css('color', '#BC8484');

                    writeNewValueToClockRegs(sXTL32K_EN, 0);
                    writeNewValueToClockRegs('C32KS', 1);
                }
            }

            triggerMultiWayConfigure();
        });
        $(".cb-disable").click(function () {
            currentHtmlFor = this.htmlFor;
            parent = $(this).parents('.switch');
            $('.cb-enable', parent).removeClass('selected');
            $(this).addClass('selected');
            $('.checkbox', parent).attr('checked', false);
            currentHtmlFor = currentHtmlFor.sliceBetweenXandX('radio_', '_disable');
            $(".ref_" + currentHtmlFor + "_p").css('color', '#BC8484');

            writeNewValueToClockRegs(currentHtmlFor, 0);

            // chain effect
            if (bNeedHandleChainEffect2 && currentHtmlFor.indexOf(sXTL32K_EN) === 0) {
                chainEffectHandler2();
            }

            triggerMultiWayConfigure();
        });
        $("#" + sXTL12M_EN + "_input").change(function () {
            if (typeof (this.value) === 'undefined' || this.value === '' || parseInt(this.value, 10) < parseInt(NUTOOL_CLOCK.g_HXTRange.slicePriorToX('~').slicePriorToX('MHz'), 10) || parseInt(this.value, 10) > parseInt(NUTOOL_CLOCK.g_HXTRange.sliceAfterX('~').slicePriorToX('MHz'), 10)) {
                $("#" + sXTL12M_EN + "_input").val(NUTOOL_CLOCK.g_HXTfrequency / 1000000);

                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('所输入的内容是不正确的。它应为' + NUTOOL_CLOCK.g_HXTRange + '。请再试一次。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('所輸入的內容是不正確的。它應為' + NUTOOL_CLOCK.g_HXTRange + '。請再試一次。');
                }
                else {
                    invokeWarningDialog('The inputted content is incorrect. It should be ' + NUTOOL_CLOCK.g_HXTRange + '. Please try again.');
                }
            }
            else if (isFieldBe1(sXTL12M_EN)) {
                g_realHXToutputClock = parseFloat($('#' + sXTL12M_EN + '_input').val()) * 1000000;
                //window.alert('3: ' + g_realHXToutputClock)
                triggerMultiWayConfigure();
            }
        });

        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $("#base_clocks_span").text('基础时脉源');
            $(".enable_span").text('启用');
            $(".disable_span").text('停用');
            $(".wait_span").text('等待');
            $(".cycles_span").text('周期');
            $('[title]').prop('title', '输入期望值');
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $("#base_clocks_span").text('基礎時脈源');
            $(".enable_span").text('啟用');
            $(".disable_span").text('停用');
            $(".wait_span").text('等待');
            $(".cycles_span").text('週期');
            $('[title]').prop('title', '輸入期望值');
        }
        else {
            $("#base_clocks_span").text('Base Clocks');
            $(".enable_span").text('Enable');
            $(".disable_span").text('Disable');
            $(".wait_span").text('Wait');
            $(".cycles_span").text('cycles');
            $('[title]').prop('title', 'Input the expected value');
        }

        $("#" + sXTL12M_EN + "_input").width(55);
        $("#" + sXTL12M_EN + "_input").height(20);

        // chain effect
        if (g_chipType === "MINI51AN" || g_chipType === "MINI51DE" ||
            g_chipType === "MINI55" || g_chipType === "MINI57" || g_chipType === "MINI58" ||
            g_chipType === "NM1200" || g_chipType === "NUC029AE") {
            bNeedHandleChainEffect = true;
            g_bHXTorLXT = true;
            chainEffectHandler();
        }
        else if (g_chipType === "NANO103") {
            bNeedHandleChainEffect1 = true;
            g_bHXTorLXT = false;
        }
        else if (g_chipType === "NUC400") {
            bNeedHandleChainEffect2 = true;
            g_bHXTorLXT = false;
            chainEffectHandler2();
        }
        else if (g_chipType === "NUC121AE") {
            bNeedHandleChainEffect3 = true;
            g_bHXTorLXT = false;
        }
        else if (g_chipType === "M2351" || g_chipType === "M2354" || g_chipType === 'M261') {
            bNeedHandleChainEffect4 = true;
            g_bHXTorLXT = false;
        }
        else {
            g_bHXTorLXT = false;
        }

        if (command !== 'single' && g_finalStep > 1) {
            add_tab_1_handler();
        }
        if ($("#tab-2")[0] || $("#tab-3")[0]) {
            $("#add-tab-1").hide();
        }

        // initialization
        if (isFieldBe1(sOSC10K_EN)) {
            $("label[for='radio_" + sOSC10K_EN + "_enable']").click();
        }
        else {
            $("label[for='radio_" + sOSC10K_EN + "_disable']").click();
        }
        if (isFieldBe1(sOSC22M_EN)) {
            $("label[for='radio_" + sOSC22M_EN + "_enable']").click();
        }
        else {
            $("label[for='radio_" + sOSC22M_EN + "_disable']").click();
        }
        if (isFieldBe1('HIRC1EN')) {
            $("label[for='radio_HIRC1EN_enable']").click();
        }
        else {
            $("label[for='radio_HIRC1EN_disable']").click();
        }
        if (isFieldBe1(sOSC22M2_EN)) {
            $("label[for='radio_" + sOSC22M2_EN + "_enable']").click();
        }
        else {
            $("label[for='radio_" + sOSC22M2_EN + "_disable']").click();
        }
        if (isFieldBe1('HIRC2EN')) {
            $("label[for='radio_HIRC2EN_enable']").click();
        }
        else {
            $("label[for='radio_HIRC2EN_disable']").click();
        }
        if (isFieldBe1('HIRC48EN')) {
            $("label[for='radio_HIRC48EN_enable']").click();
        }
        else {
            $("label[for='radio_HIRC48EN_disable']").click();
        }
        if (isFieldBe1('MIRCEN')) {
            $("label[for='radio_MIRCEN_enable']").click();
        }
        else {
            $("label[for='radio_MIRCEN_disable']").click();
        }
        if (isFieldBe1('MIRC1P2MEN')) {
            $("label[for='radio_MIRC1P2MEN_enable']").click();
        }
        else {
            $("label[for='radio_MIRC1P2MEN_disable']").click();
        }
        if (isFieldBe1(sXTL32K_EN)) {
            $("label[for='radio_" + sXTL32K_EN + "_enable']").click();
        }
        else {
            $("label[for='radio_" + sXTL32K_EN + "_disable']").click();
        }
        if (isFieldBe1('LIRC32KEN')) {
            $("label[for='radio_LIRC32KEN_enable']").click();
        }
        else {
            $("label[for='radio_LIRC32KEN_disable']").click();
        }
        if (isFieldBe1(sXTL12M_EN)) {
            $("label[for='radio_" + sXTL12M_EN + "_enable']").click();
        }
        else {
            $("label[for='radio_" + sXTL12M_EN + "_disable']").click();
        }
    }

    function buildChipTypeSelect() {
        var i,
            max,
            opt,
            $ChipTypeSelect = $("#ChipTypeSelect"),
            $ChipType_span = $("#ChipType_span"),
            $MCUChipType_span = $("#MCU_span");

        // restrict the width of the div of ChipType and MCU
        $('#ChipType')[0].setAttribute('style', 'background-color: #FFFFFF; width:' + (g_NUC_TreeView_Width - 16) + 'px; border-right: 16px solid #FFFFFF; border-bottom: 5px solid #FFFFFF;');
        $('#MCU')[0].setAttribute('style', 'background-color: #FFFFFF; width:' + (g_NUC_TreeView_Width - 16) + 'px; border-right: 16px solid #FFFFFF; border-bottom: 5px solid #FFFFFF;');
        $('#ChipType').hover(function () { $(this).css('background-color', '#FAFAFA'); }, function () { $(this).css('background-color', '#FFFFFF'); });
        $('#MCU').hover(function () { $(this).css('background-color', '#FAFAFA'); }, function () { $(this).css('background-color', '#FFFFFF'); });

        //$('#MCU')[0].setAttribute('style', 'width:' + (g_NUC_TreeView_Width - 16) + 'px; border-right: 16px solid #F2F2F2;');
        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            $ChipType_span.text('晶片系列:');
            $MCUChipType_span.text('型号:');
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            $ChipType_span.text('晶片系列:');
            $MCUChipType_span.text('型號:');
        }
        else {
            $ChipType_span.text('Chip Series:');
            $MCUChipType_span.text('Part No.:');
        }

        $ChipType_span.css('font-size', '16px');
        $ChipType_span.css('font-weight', 'bold');
        $MCUChipType_span.css('font-size', '16px');
        $MCUChipType_span.css('font-weight', 'bold');

        for (i = 0, max = g_chipTypes.length; i < max; i += 1) {
            opt = window.document.createElement("option");
            try { opt.id = opt.innerHTML = opt.value = g_chipTypes[i]; } catch (err) { }
            $ChipTypeSelect[0].appendChild(opt);
        }
        $ChipTypeSelect.val(chipTypeToChipSeries(g_chipType));

        // build the corresponding MCU selects.
        buildMCUselect();

        $ChipTypeSelect.on('change', function () {
            var oldfilename,
                newfilename;
            if (g_chipType != $(this).val()) {
                oldfilename = 'NUC_' + g_chipType + '_Content.js';
                g_chipType = chipSeriesToChipType($(this).val());
                newfilename = 'NUC_' + g_chipType + '_Content.js';

                replacejscssfile(oldfilename, newfilename, 'js', buildMCUselect);
            }
        });
    }

    function buildMCUselect() {
        var i,
            max,
            $MCUselect = $('#MCUselect'),
            opt = {},
            mcuSelectArray = [],
            bCorrectpartNumber_package = false;
        // remove all MCU selects then populate new ones.
        if ($MCUselect.children().length > 0) {
            $MCUselect.children().remove();
        }

        for (i = 0, max = NUTOOL_CLOCK.g_cfg_chips.length; i < max; i += 1) {
            try { mcuSelectArray.push(NUTOOL_CLOCK.g_cfg_chips[i].name + '(' + NUTOOL_CLOCK.g_cfg_chips[i].pkg + ')'); } catch (err) { }
        }
        mcuSelectArray.sort(natualSort);
        for (i = 0, max = mcuSelectArray.length; i < max; i += 1) {
            opt = window.document.createElement("option");
            opt.id = opt.innerHTML = opt.value = mcuSelectArray[i];
            $MCUselect[0].appendChild(opt);
        }
        // check if the g_partNumber_package is correct
        for (i = 0, max = NUTOOL_CLOCK.g_cfg_chips.length; i < max; i += 1) {
            if (NUTOOL_CLOCK.g_cfg_chips[i].name + '(' + NUTOOL_CLOCK.g_cfg_chips[i].pkg + ')' === g_partNumber_package) {
                bCorrectpartNumber_package = true;
                break;
            }
        }

        if (!bCorrectpartNumber_package) {
            $MCUselect.val($("#MCUselect option:first-child").val()).change();
        }
        else {
            $MCUselect.val(g_partNumber_package);
        }

        $MCUselect.on('change', function () {
            if (g_selectedPartNoValue !== $(this).val()) {
                g_selectedPartNoValue = $(this).val();
                // to prevent the select from hanging here due to invoking a big function, the function will be invoked immediately after this event is finished.
                window.setTimeout(afterMCUchange, 0);
            }
        });
    }

    function buildClockRegsTree() {
        var i,
            max,
            j,
            maxJ,
            clockRegistersNameString = "",
            dataChildrenArray = [],
            local_clockRegisterNames = [],
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module).slice(),
            dataChildren,
            jsonData = {},
            attr,
            $rootTree = $("#rootTree_Clock"),
            $searchModule,
            $searchModule_span,
            $searchInput,
            searchInput_inner,
            $clockRegsTree = $("#clockRegsTree"),
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            sPWRCON = 'PWRCON'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            sPCLK0SEL = 'PCLK0SEL'.toEquivalent().toString();

        // populate moduleNames with the base clocks, PLL, and HCLK/PCLK.
        moduleNames.push(sHCLK);
        if (sHCLK !== 'CPUCLK') {
            moduleNames.push("CPUCLK");
        }
        if (NUTOOL_CLOCK.g_LIRCfrequency !== 0) {
            moduleNames.push(sLIRC);
        }
        if (NUTOOL_CLOCK.g_HIRCfrequency !== 0) {
            moduleNames.push(sHIRC);
        }
        if (NUTOOL_CLOCK.g_HIRC2frequency !== 0) {
            moduleNames.push(sHIRC2);
        }
        if (NUTOOL_CLOCK.g_HIRC48frequency !== 0) {
            moduleNames.push('HIRC48');
        }
        if (NUTOOL_CLOCK.g_MIRCfrequency !== 0) {
            moduleNames.push('MIRC');
        }
        if (NUTOOL_CLOCK.g_MIRC1P2Mfrequency !== 0) {
            moduleNames.push('MIRC1P2M');
        }
        if (NUTOOL_CLOCK.g_RTC32kfrequency !== 0) {
            moduleNames.push('RTC32k');
        }
        if (checkForField(sXTL32K_EN + ':')) {
            moduleNames.push(sLXT);
        }
        if (checkForField(sXTL12M_EN + ':')) {
            moduleNames.push(sHXT);
        }
        if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
            moduleNames.push(sPLL);
        }
        if (typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined') {
            moduleNames.push('PLL2');
        }
        if (NUTOOL_CLOCK.g_PLL480Mfrequency !== 0) {
            moduleNames.push('PLL480M');
        }
        if (typeof NUTOOL_CLOCK.g_register_map.APLLCTL !== 'undefined') {
            moduleNames.push('APLL');
        }
        if (typeof NUTOOL_CLOCK.g_register_map.PLLFNCTL0 !== 'undefined') {
            moduleNames.push('PLLFN');
        }
        if (NUTOOL_CLOCK.g_HSUSBOTGPHYfrequency !== 0) {
            moduleNames.push('HSUSB_OTG_PHY');
        }
        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL)) {
            moduleNames.push("PCLK0");
            moduleNames.push("PCLK1");
            moduleNames.push("PCLK2");
        }
        else {
            moduleNames.push(sPCLK);
        }
        moduleNames.sort();

        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            local_clockRegisterNames[i] = g_clockRegisterNames[i];
        }
        local_clockRegisterNames.sort();

        // populate the json_data
        for (i = 0, max = local_clockRegisterNames.length; i < max; i += 1) {
            if (local_clockRegisterNames[i].length > g_maxClockRegsStringLength) {
                g_maxClockRegsStringLength = local_clockRegisterNames[i].length;
            }
        }
        // adjust g_NUC_TreeView_Width based on the actual length of register name
        g_NUC_TreeView_Width = 250;
        if (((g_maxClockRegsStringLength + 1 + 2 + 8) * 10 + 50) > g_NUC_TreeView_Width) {
            g_NUC_TreeView_Width = (g_maxClockRegsStringLength + 1 + 2 + 8) * 10 + 40;
            $("#ChipType").width(g_NUC_TreeView_Width - 16);
            $("#MCU").width(g_NUC_TreeView_Width - 16);
        }

        for (i = 0, max = local_clockRegisterNames.length; i < max; i += 1) {
            clockRegistersNameString = local_clockRegisterNames[i];

            if (clockRegistersNameString.length < g_maxClockRegsStringLength) {
                for (j = 0, maxJ = (g_maxClockRegsStringLength - clockRegistersNameString.length); j < maxJ; j += 1) {
                    clockRegistersNameString += g_unPrintedCharacters;
                }
            }

            dataChildren = {};
            attr = {};

            attr.id = local_clockRegisterNames[i];
            dataChildren.data = clockRegistersNameString + ':0x' + decimalToHex(g_clockRegs[local_clockRegisterNames[i]]).toUpperCase();
            dataChildren.attr = attr;

            dataChildrenArray[i] = dataChildren;
        }
        attr = {};

        attr.id = 'clock_tree';
        decideUIlanguage();
        if (g_userSelectUIlanguage === "Simplified Chinese") {
            jsonData.data = 'Clock寄存器';
        }
        else if (g_userSelectUIlanguage === "Traditional Chinese") {
            jsonData.data = 'Clock暂存器';
        }
        else {
            jsonData.data = 'Clock Registers';
        }
        jsonData.attr = attr;
        jsonData.state = 'open';
        jsonData.children = dataChildrenArray;
        // create a tree of clock registers
        if ($clockRegsTree.length === 0) {
            $rootTree[0].appendChild(ce("div", 'clockRegsTree', 'Loading...'));
            $clockRegsTree = $("#clockRegsTree");
        }

        if (g_chipType.indexOf("M460") === 0) {     // M460 Register太多，所以加上scroll bar (overflow-y: scroll)
            $clockRegsTree[0].setAttribute('style', 'background-color: #FFFFFF; overflow-y: scroll; float:left; width:' + (g_NUC_TreeView_Width) + 'px; height: ' + ((local_clockRegisterNames.length) * 14) + 'px; border-right: 16px solid #FFFFFF; border-bottom: 5px solid #FFFFFF;');
        } else {
            $clockRegsTree[0].setAttribute('style', 'background-color: #FFFFFF; float:left; width:' + (g_NUC_TreeView_Width - 16) + 'px; height: ' + ((local_clockRegisterNames.length) * 20) + 'px; border-right: 16px solid #FFFFFF; border-bottom: 5px solid #FFFFFF;');
        }
        $clockRegsTree.hover(function () { $(this).css('background-color', '#FAFAFA'); }, function () { $(this).css('background-color', '#FFFFFF'); });
        $clockRegsTree.jstree({
            "json_data": { "data": jsonData },
            "themes": {
                "theme": "default",
                "icons": false,
                "dots": true
            },
            'core': {
                'animation': 0
            },
            "plugins": ["themes", "json_data", "ui", "crrm"]
        }).bind("hover_node.jstree", function (e, data) {
            var currentNode = data.rslt.obj.attr("id"),
                tooltipText;
            // display the tooltip around the mouse cursor
            if (NUTOOL_CLOCK.g_register_map_description.hasOwnProperty(currentNode)) {

                if (g_userSelectUIlanguage === "Simplified Chinese") {
                    tooltipText = '位址: ';
                }
                else if (g_userSelectUIlanguage === "Traditional Chinese") {
                    tooltipText = '位址: ';
                }
                else {
                    tooltipText = 'Address: ';
                }

                tooltipText = tooltipText + NUTOOL_CLOCK.g_register_map_description[currentNode];
                $('#' + currentNode).simpletip({ fixed: true, offset: [80, -10] });
                $('#' + currentNode).eq(0).simpletip().update(tooltipText);
            }
        }).bind("dblclick.jstree", function (e) {
            var node = $(e.target).closest("li"),
                id = node[0].id; //id of the selected node

            if (id === 'clock_tree' ||
                NUTOOL_CLOCK.g_register_map_description[id].indexOf('Read Only') !== -1) {
                return;
            }
            $clockRegsTree.jstree('rename', $("#" + id));

            $('#' + id).eq(0).simpletip().blockShow();
            $('#' + id).eq(0).simpletip().hide();
        }).bind("rename.jstree", function (e, data) {
            var id = data.rslt.obj.attr("id"), //id of the selected node
                oldText = data.rslt.old_name,
                newText = data.rslt.new_name;

            if (newText.indexOf(sPLL) !== -1) {
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    invokeWarningDialog('若要设置' + sPLL + '，请至' + sPLL + '页面。');
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    invokeWarningDialog('若要設置' + sPLL + '，請至' + sPLL + '頁面。');
                }
                else {
                    invokeWarningDialog('To configure ' + sPLL + ', please refer to the ' + sPLL + ' page.');
                }

                // replace incorrect input with the old content.
                $clockRegsTree.jstree('rename_node', $("#" + id), oldText);
            }
            else if (newText.indexOf(':0x') !== -1 &&
                newText.slicePriorToX(':') === oldText.slicePriorToX(':') &&
                newText.sliceAfterX(':').length === oldText.sliceAfterX(':').length &&
                newText !== oldText) {
                g_clockRegs[id] = parseInt(newText.sliceAfterX(':'), 16);
                saveCurrentConfig();
                saveNu_config();
                // we want to recover the tool from Nu_Config.cfg
                NUTOOL_CLOCK.g_readConfigFilePath = "";
                initializeAll();
                decideChipTypeAndClockRegs();
                // disable TriggerMultiConfiguring
                g_bIsTriggerMultiConfiguring = true;
                refresh();
                // enable TriggerMultiConfiguring
                g_bIsTriggerMultiConfiguring = false;
                if (!g_bReadyForRelease && window.console) { window.console.log("In the end of rename.jstree."); }
            }
            else {
                // replace incorrect input with the old content.
                $clockRegsTree.jstree('rename_node', $("#" + id), oldText);
            }
            //window.alert(id + ':0x' + decimalToHex(g_clockRegs[id]).toUpperCase())
            //$clockRegsTree.jstree('rename_node', $("#" + id), id + ':0x' + decimalToHex(g_clockRegs[id]).toUpperCase());
        }).bind('loaded.jstree', function () {
            // record the latest g_clockRegs
            recordConfig();

            updateClockRegsTree();
            g_clockRegTreesLoaded = true;
            if (g_urlParameter.indexOf('EmbeetleIDE_CodeGenerator') != -1) {
                hideElementsByIdArray(['ID_BUTTON_SHOW_REGISTERS', 'ID_BUTTON_LOAD', 'ID_BUTTON_SAVE', 'ID_BUTTON_GENERATE_CODE', 'ID_BUTTON_CONNECT_TO_TARGET', 'ID_BUTTON_LANGUAGE', 'ID_BUTTON_INSTRUCTION'])
                showChipTypeAndMCU(false);
                g_bSkipShowWarningForTriggerMultiWayConfigure = true;
            }
            else if (typeof NUTOOL_PER !== 'undefined') {
                g_bSkipShowWarningForTriggerMultiWayConfigure = true;
            }
        }).bind('destroy.jstree', function () {
        });

        $clockRegsTree.css("font-size", '16px');
        $clockRegsTree.css("font-family", 'Monaco, Consolas, "Lucida Console", monospace;');

        // create a search input
        if (g_userSelectUIlanguage === "Simplified Chinese") {
            searchInput_inner = '搜寻模块';
        }
        else if (g_userSelectUIlanguage === "Traditional Chinese") {
            searchInput_inner = '搜尋模組';
        }
        else {
            searchInput_inner = 'Search Module';
        }

        $rootTree[0].appendChild(ce("div", 'searchModule', ""));
        $searchModule = $("#searchModule");
        $searchModule.append('<span id=searchModule_span></span>');
        $searchModule_span = $("#searchModule_span");
        $searchModule_span.css('font-size', '16px');
        $searchModule_span.css('font-weight', 'bold');
        $searchModule.append("<input id='searchInput' type='text' value=''>");
        $searchInput = $('#searchInput');

        $searchModule[0].setAttribute('style', 'background-color: #FFFFFF; border-right: 16px solid #FFFFFF; float:left; width:' + (g_NUC_TreeView_Width - 16) + 'px; height: 22px;');
        $searchModule_span.text(searchInput_inner);
        $searchInput[0].setAttribute('style', 'font-family:Times Arial; position:absolute; left:' + ($searchModule_span.width() + 10) + 'px; width:' + (g_NUC_TreeView_Width - 16 - $searchModule_span.width() - 10) + 'px; height: 16px;');
        $searchInput.change(function () {
            var currentText,
                tooltipText,
                tempArray;

            if (g_svgGroup !== null) {
                g_svgGroup.selectAll("g.node").on("searchFromInput")(this.value);
                $("#tabs").tabs({ active: 3 });
                if ($("#tabs").tabs('option', 'active') !== 3) {
                    $("#tabs").tabs({ active: 2 });
                }
            }

            currentText = $(this).val();
            $searchModule.simpletip({ fixed: true, offset: [100, -7] });
            tooltipText = "";
            if (currentText !== "") {
                tempArray = [];
                for (i = 0, max = moduleNames.length; i < max; i += 1) {
                    if (moduleNames[i].toLowerCase().indexOf(currentText.toLowerCase()) === 0) {
                        tempArray.push(moduleNames[i]);
                    }
                }

                if (tempArray.length > 0) {
                    if (g_userSelectUIlanguage === "Simplified Chinese") {
                        tooltipText = '符合的搜寻结果为:<br />';
                    }
                    else if (g_userSelectUIlanguage === "Traditional Chinese") {
                        tooltipText = '符合的搜尋結果為:<br />';
                    }
                    else {
                        tooltipText = 'The matched search result is:<br />';
                    }

                    for (i = 0, max = tempArray.length; i < max; i += 1) {
                        tooltipText = tooltipText + tempArray[i] + '<br />';
                    }
                }
            }

            if (tooltipText !== "") {
                if (!g_bReadyForRelease && window.console) { window.console.log("In $searchInput.change, unblockShow."); }
                //window.alert("In $searchInput.change, unblockShow.")
                $searchModule.eq(0).simpletip().unblockShow();
                $searchModule.eq(0).simpletip().update(tooltipText);
                $searchModule.eq(0).simpletip().show();
            }
            else {
                $searchModule.eq(0).simpletip().blockShow();
                $searchModule.eq(0).simpletip().hide();
            }
        });
        // At first, the search input should be hidden.
        $searchModule.hide();
    }

    function createjscssfile(filename, filetype) {
        var fileref;
        if (filetype === "js") { //if filename is a external JavaScript file
            fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            if (typeof NUTOOL_PER !== 'undefined') {
                fileref.setAttribute("src", filename);
            }
            else {
                fileref.setAttribute("src", `${filename}`);
            }
        }
        else if (filetype === "css") { //if filename is an external CSS file
            fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            if (typeof NUTOOL_PER !== 'undefined') {
                fileref.setAttribute("href", filename);
            }
            else {
                fileref.setAttribute("href", `${filename}`);
            }
        }
        return fileref;
    }

    function replacejscssfile(oldfilename, newfilename, filetype, callback) {
        var i,
            targetelement = (filetype === "js") ? "script" : (filetype === "css") ? "link" : "none", //determine element type to create nodelist using
            targetattr = (filetype === "js") ? "src" : (filetype === "css") ? "href" : "none", //determine corresponding attribute to test for
            allsuspects = window.document.getElementsByTagName(targetelement),
            newelement;

        if (typeof NUTOOL_PER !== 'undefined' && filetype === "js") {
            // Add the preceding path
            oldfilename = "ClockConfigure/" + oldfilename;
            newfilename = "ClockConfigure/" + newfilename;
        }
        newelement = createjscssfile(newfilename, filetype);
        // 因為從html載入新content檔需要時間，所以等onload再執行callback function
        if (typeof callback === 'function') {
            newelement.onload = function () {
                callback();
            }
        };

        if (!g_bReadyForRelease && window.console) { window.console.log("In replacejscssfile, oldfilename:" + oldfilename + " / newfilename:" + newfilename); }

        // To update the data in js file fresh, remove the matched files and add the new one.
        for (i = allsuspects.length; i >= 0; i -= 1) { //search backwards within nodelist for matching elements to remove
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) !== null) {
                if (allsuspects[i].getAttribute(targetattr) === oldfilename) {
                    allsuspects[i].parentNode.removeChild(allsuspects[i]);
                }
                else if (allsuspects[i].getAttribute(targetattr) === newfilename) {
                    allsuspects[i].parentNode.removeChild(allsuspects[i]);
                }
            }
        }

        allsuspects[0].parentNode.appendChild(newelement);
    }

    function afterMCUchange() {
        var oldChipType;
        //avoidClicking();

        if (g_selectedPartNoValue !== g_partNumber_package) {
            // to tackle the case of multiple usage of this app
            try { window.external.updateCurrentDialogSize(); } catch (err) { }

            oldChipType = g_chipType;
            g_chipType = decideNewChipType(g_selectedPartNoValue);
            // reload Content Js file to get the primitive NUTOOL_CLOCK.g_cfg_gpios in case that it was modified
            replacejscssfile('NUC_' + oldChipType + '_Content.js', 'NUC_' + g_chipType + '_Content.js', 'js', afterMCUchangeAfterReplace);
        }

        oldChipType = null;
    }

    function afterMCUchangeAfterReplace() {
        g_partNumber_package = g_selectedPartNoValue;
        initializeAll();
        NUTOOL_CLOCK.g_readConfigFilePath = 'dummyPath';

        decideClockRegsNamesAndContent();

        refresh();
    }

    function chipSeriesToChipType(chipSeries) {
        var stringChipType;
        stringChipType = chipSeries;

        // it should match the first part number.
        if (chipSeries === "NUC200") {
            stringChipType = "NUC200AN";
        }
        else if (chipSeries === "NANO100") {
            stringChipType = "NANO100AN";
        }
        else if (chipSeries === "NUC100") {
            stringChipType = "NUC100DN";
        }
        else if (chipSeries === "M030G") {
            stringChipType = "M030G_31G";
        }
        else if (chipSeries === "M031") {
            stringChipType = "M031BT";
        }
        else if (chipSeries === "M051") {
            stringChipType = "M051DE";
        }
        else if (chipSeries === "MINI51") {
            stringChipType = "MINI55";
        }
        else if (chipSeries === "NUC029") {
            stringChipType = "NUC029AE";
        }
        else if (chipSeries === "M460") {
            stringChipType = "M460HD";
        }
        else if (chipSeries === "M480") {
            stringChipType = "M480MD";
        }
        else if (chipSeries === "M2003") {
            stringChipType = "M2003C";
        }

        return stringChipType;
    }

    function chipTypeToChipSeries(chipType) {
        var stringChipSeries;
        stringChipSeries = chipType;

        if (chipType === "NUC200AN") {
            stringChipSeries = "NUC200";
        }
        else if (chipType === "NUC200AE") {
            stringChipSeries = "NUC200";
        }
        else if (chipType === "NUC2201") {
            stringChipSeries = "NUC200";
        }
        else if (chipType === "NANO100AN") {
            stringChipSeries = "NANO100";
        }
        else if (chipType === "NANO100BN") {
            stringChipSeries = "NANO100";
        }
        else if (chipType === "NANO103") {
            stringChipSeries = "NANO100";
        }
        else if (chipType === "NANO112") {
            stringChipSeries = "NANO100";
        }
        else if (chipType === "NUC100AN") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC100BN") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC100CN") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC100DN") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC131") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC121AE") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC123AN_AE") {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "NUC122AN") {
            stringChipSeries = "NUC100";
        }
        else if (chipType.indexOf("NUC126") === 0) {
            stringChipSeries = "NUC100";
        }
        else if (chipType === "M051BN") {
            stringChipSeries = "M051";
        }
        else if (chipType.indexOf("M030G") === 0) {
            stringChipSeries = "M030G";
        }
        else if (chipType.indexOf("M03") === 0) {
            stringChipSeries = "M031";
        }
        else if (chipType === "M051DN") {
            stringChipSeries = "M051";
        }
        else if (chipType === "M051DE") {
            stringChipSeries = "M051";
        }
        else if (chipType === "M051AN") {
            stringChipSeries = "M051";
        }
        else if (chipType === "M058S") {
            stringChipSeries = "M051";
        }
        else if (chipType.indexOf("MINI5") === 0) {
            stringChipSeries = "MINI51";
        }
        else if (chipType.indexOf("NUC029") === 0) {
            stringChipSeries = "NUC029";
        }
        else if (chipType.indexOf("M235") === 0) {
            stringChipSeries = "M2351";
        }
        else if (chipType.indexOf("M25") === 0) {
            stringChipSeries = "M251";
        }
        else if (chipType.indexOf("M460") === 0) {
            stringChipSeries = "M460";
        }
        else if (chipType.indexOf("M480") === 0) {
            stringChipSeries = "M480";
        }
        else if (chipType.indexOf("M2003") === 0) {
            stringChipSeries = "M2003C";
        }

        return stringChipSeries;
    }

    function decideInputClockFreq(inputSource) {
        var inputClockFreq,
            dividerValue,
            dividerName,
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString();

        if (inputSource.indexOf('DIV') !== -1) {
            dividerName = inputSource.sliceAfterX('(');
            dividerName = dividerName.slicePriorToX(':').slicePriorToX('+');

            dividerValue = readValueFromClockRegs(dividerName) + 1;
        }
        else if (inputSource.indexOf('/') !== -1) {
            dividerValue = parseFloat(inputSource.sliceAfterX('/'));
        }
        else {
            dividerValue = 1;
        }

        if (inputSource.indexOf(sLIRC) === 0) {
            inputClockFreq = g_realLIRCoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('HIRC48') === 0) {
            inputClockFreq = g_realHIRC48outputClock / dividerValue;
        }
        else if (inputSource.indexOf(sHIRC) === 0) {
            inputClockFreq = g_realHIRCoutputClock / dividerValue;
        }
        else if (inputSource.indexOf(sHIRC2) === 0) {
            inputClockFreq = g_realHIRC2outputClock / dividerValue;
        }
        else if (inputSource.indexOf('MIRC1P2M') === 0) {
            inputClockFreq = g_realMIRC1P2MoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('MIRC') === 0) {
            inputClockFreq = g_realMIRCoutputClock / dividerValue;
        }
        else if (inputSource.indexOf(sLXT) === 0) {
            inputClockFreq = g_realLXToutputClock / dividerValue;
        }
        else if (inputSource.indexOf(sHXT) === 0) {
            inputClockFreq = g_realHXToutputClock / dividerValue;
        }
        else if (inputSource.indexOf('RTC32k') === 0) {
            inputClockFreq = g_realRTC32koutputClock / dividerValue;
        }
        else if (inputSource.indexOf('PLL480M') === 0) {
            inputClockFreq = g_realPLL480MoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('PLL2') === 0) {
            inputClockFreq = g_realPLL2outputClock / dividerValue;
        }
        else if (inputSource.indexOf(sPLL) === 0) {
            inputClockFreq = g_realPLLoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('APLL') === 0) {
            inputClockFreq = g_realAPLLoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('PLLFN') === 0) {
            inputClockFreq = g_realPLLFNoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('HSUSB_OTG_PHY') === 0) {
            inputClockFreq = g_realHSUSBOTGPHYoutputClock / dividerValue;
        }
        else if (inputSource.indexOf(sHCLK) === 0) {
            inputClockFreq = g_realHCLKoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('PCLK0') === 0) {
            inputClockFreq = g_realPCLK0outputClock / dividerValue;
        }
        else if (inputSource.indexOf('PCLK1') === 0) {
            inputClockFreq = g_realPCLK1outputClock / dividerValue;
        }
        else if (inputSource.indexOf('PCLK2') === 0) {
            inputClockFreq = g_realPCLK2outputClock / dividerValue;
        }
        else if (inputSource.indexOf(sPCLK) === 0) {
            inputClockFreq = g_realPCLKoutputClock / dividerValue;
        }
        else if (inputSource.indexOf('CPUCLK') === 0) {
            inputClockFreq = g_realHCLKoutputClock / dividerValue;
        }

        return inputClockFreq;
    }

    function decideClockRegsNamesAndContent(newClockRegs) {
        var i,
            j,
            k,
            max,
            maxJ,
            maxK,
            unusedObject = {},
            moduleName,
            selectorNames = getPropertyNames(NUTOOL_CLOCK.g_CLKSEL),
            localModuleProperties = [],
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            sPWRCON = 'PWRCON'.toEquivalent().toString(),
            sPLLCON = 'PLLCON'.toEquivalent().toString(),
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString();

        // trim some unused module if exists
        if (typeof (NUTOOL_CLOCK.g_unusedModule) !== 'undefined') {
            if (typeof (NUTOOL_CLOCK.g_unusedModule[g_partNumber_package]) !== 'undefined') {
                if (typeof (NUTOOL_CLOCK.g_unusedModule[g_partNumber_package]) == "function") {
                    unusedObject = NUTOOL_CLOCK.g_unusedModule[g_partNumber_package]();
                }
                else {
                    unusedObject = NUTOOL_CLOCK.g_unusedModule[g_partNumber_package];
                }
            }
            else if (typeof (NUTOOL_CLOCK.g_unusedModule[g_partNumber_package.slicePriorToX('(')]) !== 'undefined') {
                if (typeof (NUTOOL_CLOCK.g_unusedModule[g_partNumber_package.slicePriorToX('(')]) == "function") {
                    unusedObject = NUTOOL_CLOCK.g_unusedModule[g_partNumber_package.slicePriorToX('(')]();
                }
                else {
                    unusedObject = NUTOOL_CLOCK.g_unusedModule[g_partNumber_package.slicePriorToX('(')];
                }
            }
            localModuleProperties = getPropertyNames(NUTOOL_CLOCK.g_Module);
            for (k = 0, maxK = unusedObject.length; k < maxK; k += 1) {
                moduleName = unusedObject[k];
                // trim the unused module in NUTOOL_CLOCK.g_Module
                for (j = 0, maxJ = localModuleProperties.length; j < maxJ; j += 1) {
                    if (moduleName.toUpperCase() === localModuleProperties[j].toUpperCase()) {
                        delete NUTOOL_CLOCK.g_Module[moduleName];
                        break;
                    }
                }

                if (moduleName.toUpperCase() === sLXT) {
                    for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[sPWRCON].length; j < maxJ; j += 1) {
                        if (NUTOOL_CLOCK.g_register_map[sPWRCON][j].indexOf(sXTL32K_EN + ':') === 0) {
                            NUTOOL_CLOCK.g_register_map[sPWRCON].splice(j, 1);
                            break;
                        }
                    }
                    for (i = 0, max = selectorNames.length; i < max; i += 1) {
                        for (j = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].length - 1; j >= 0; j -= 1) {
                            if (NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf('LXT:') === 0 ||
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf('LXT/') === 0) {
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].splice(j, 1);
                            }
                        }
                    }
                }
                if (moduleName.toUpperCase() === sHXT.toUpperCase()) {
                    for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[sPWRCON].length; j < maxJ; j += 1) {
                        if (NUTOOL_CLOCK.g_register_map[sPWRCON][j].indexOf(sXTL12M_EN + ':') === 0) {
                            NUTOOL_CLOCK.g_register_map[sPWRCON].splice(j, 1);
                            break;
                        }
                    }
                    for (i = 0, max = selectorNames.length; i < max; i += 1) {
                        for (j = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].length - 1; j >= 0; j -= 1) {
                            if (NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf(sHXT + ':') === 0 ||
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf(sHXT + '/') === 0) {
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].splice(j, 1);
                            }
                        }
                    }
                }
                if (moduleName.toUpperCase() === sPLL.toUpperCase()) {
                    delete NUTOOL_CLOCK.g_register_map[sPLLCON];
                    delete NUTOOL_CLOCK.g_register_map_default[sPLLCON];
                    delete NUTOOL_CLOCK.g_register_map_description[sPLLCON];

                    for (i = 0, max = selectorNames.length; i < max; i += 1) {
                        for (j = NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].length - 1; j >= 0; j -= 1) {
                            if (NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf(sPLL + ':') === 0 ||
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]][j].indexOf(sPLL + '/') === 0) {
                                NUTOOL_CLOCK.g_CLKSEL[selectorNames[i]].splice(j, 1);
                            }
                        }
                    }
                }
            }
        }
        // get g_clockRegisterNames
        g_clockRegisterNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_default);
        // adjust g_register_map_default according to the current tool
        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            if (typeof NUTOOL_PER === 'undefined' && g_bInvokedByCDHtmlDialog === true &&
                typeof NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuClockConfig !== 'undefined') {
                NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]] = NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuClockConfig;
            }
            else if (typeof NUTOOL_PER === 'undefined' && g_bInvokedByCDHtmlDialog === false &&
                typeof NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuClockConfigTest !== 'undefined') {
                NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]] = NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuClockConfigTest;
            }
            else if (typeof NUTOOL_PER !== 'undefined' && NUTOOL_PER.getg_bDevelopingTool() === false &&
                typeof NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuCodeGenTool !== 'undefined') {
                NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]] = NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuCodeGenTool;
            }
            else if (typeof NUTOOL_PER !== 'undefined' && NUTOOL_PER.getg_bDevelopingTool() === true &&
                typeof NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuCodeGenTest !== 'undefined') {
                NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]] = NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]].NuCodeGenTest;
            }
        }

        if (typeof (newClockRegs) !== 'undefined' && getPropertyNames(newClockRegs).length > 0) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                g_clockRegs[g_clockRegisterNames[i]] = newClockRegs[g_clockRegisterNames[i]];
            }
        }
        else {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                g_clockRegs[g_clockRegisterNames[i]] = parseInt(NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]], 16);
            }
        }
    }

    function decideNewChipType(newPartNumber_package) {
        var newChipType;

        // newPartNumber_package obtained from OpenOCD does not contain the package information
        if (newPartNumber_package.indexOf('(') === -1) {
            newPartNumber_package = newPartNumber_package + '(';
        }

        // decide chip type from part number name
        // the sequence is sensitive. do not disorder them.
        if (newPartNumber_package.indexOf('M0564') === 0) {
            newChipType = 'M0564';
        }
        else if (newPartNumber_package.indexOf('M45') === 0 || newPartNumber_package.indexOf('M4TK') === 0) {
            newChipType = 'M451';
        }
        else if (newPartNumber_package.indexOf('M46') === 0) {
            if (newPartNumber_package.indexOf('CAE') !== -1) {
                newChipType = 'M460LD';
            }
            else {
                newChipType = 'M460HD';
            }
        }
        else if (newPartNumber_package.indexOf('M48') === 0) {
            if (newPartNumber_package.indexOf('8AE') !== -1 || newPartNumber_package.indexOf('CAE') !== -1) {
                newChipType = 'M480LD';
            }
            else {
                newChipType = 'M480MD';
            }
        }
        else if (newPartNumber_package.indexOf('M251') === 0 || newPartNumber_package.indexOf('M252') === 0) {
            newChipType = 'M251';
        }
        else if (newPartNumber_package.indexOf('M253') === 0) {
            newChipType = 'M253';
        }
        else if (newPartNumber_package.indexOf('M254') === 0 || newPartNumber_package.indexOf('M256') === 0 ||
            newPartNumber_package.indexOf('M258') === 0) {
            newChipType = 'M258';
        }
        else if (newPartNumber_package.indexOf('M030G') === 0 ||
            newPartNumber_package.indexOf('M031G') === 0) {
            newChipType = 'M030G_31G';
        }
        else if (newPartNumber_package.indexOf('M031BT') === 0) {
            newChipType = 'M031BT';
        }
        else if (newPartNumber_package.indexOf('M031') === 0 || newPartNumber_package.indexOf('M032') === 0) {
            newChipType = 'M031';
        }
        else if (newPartNumber_package.indexOf('M2351') === 0) {
            newChipType = 'M2351';
        }
        else if (newPartNumber_package.indexOf('M2354') === 0) {
            newChipType = 'M2354';
        }
        else if (newPartNumber_package.indexOf('M26') === 0) {
            newChipType = 'M261';
        }
        else if (newPartNumber_package.indexOf('APM32E103ZE') === 0) {
            newChipType = 'APM32E103xCxE';
        }
        else if (newPartNumber_package.indexOf('M0518') === 0) {
            newChipType = 'M0518';
        }
        else if (newPartNumber_package.indexOf('M0519') === 0) {
            newChipType = 'M0519';
        }
        else if (newPartNumber_package.indexOf('M05') === 0 && newPartNumber_package.indexOf('DN(') !== -1) {
            newChipType = 'M051DN';
        }
        else if (newPartNumber_package.indexOf('M05') === 0 && newPartNumber_package.indexOf('DE(') !== -1) {
            newChipType = 'M051DE';
        }
        else if (newPartNumber_package.indexOf('MHC54ZDN') === 0 || newPartNumber_package.indexOf('PL054TDN') === 0) {
            newChipType = 'M051DN';
        }
        else if (newPartNumber_package.indexOf('M05') === 0 && newPartNumber_package.indexOf('BN(') !== -1) {
            newChipType = 'M051BN';
        }
        else if (newPartNumber_package.indexOf('E32') === 0) {
            newChipType = 'M051BN';
        }
        else if (newPartNumber_package.indexOf('M058S') === 0) {
            newChipType = 'M058S';
        }
        else if (newPartNumber_package.indexOf('M05') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'M051AN';
        }
        else if (newPartNumber_package.indexOf('MINI57') === 0) {
            newChipType = 'MINI57';
        }
        else if (newPartNumber_package.indexOf('MINI58') === 0) {
            newChipType = 'MINI58';
        }
        else if (newPartNumber_package.indexOf('MINI5') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'MINI51AN';
        }
        else if ((newPartNumber_package.indexOf('MINI5') === 0 && newPartNumber_package.indexOf('AE(') !== -1) ||
            newPartNumber_package.indexOf('MINI54XFHC') === 0 ||
            newPartNumber_package.indexOf('MINI55') === 0 ||
            newPartNumber_package.indexOf('NVS06AL') === 0) {
            newChipType = 'MINI55';
        }
        else if ((newPartNumber_package.indexOf('MINI5') === 0 && newPartNumber_package.indexOf('DE(') !== -1) ||
            newPartNumber_package.indexOf('MINI54FHC') === 0) {
            newChipType = 'MINI51DE';
        }
        else if (newPartNumber_package.indexOf('NUC2201') === 0) {
            newChipType = 'NUC2201';
        }
        else if (newPartNumber_package.indexOf('NUC2') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NUC200AN';
        }
        else if (newPartNumber_package.indexOf('NUC2') === 0 && newPartNumber_package.indexOf('AE(') !== -1) {
            newChipType = 'NUC200AE';
        }
        else if (newPartNumber_package.indexOf('NUC029ZAN') === 0) {
            newChipType = 'NUC029ZAN';
        }
        else if (newPartNumber_package.indexOf('NUC029LDE') === 0 || newPartNumber_package.indexOf('NUC029SDE') === 0) {
            newChipType = 'NUC029xDE';
        }
        else if (newPartNumber_package.indexOf('NUC029LGE') === 0 || newPartNumber_package.indexOf('NUC029SGE') === 0 ||
            newPartNumber_package.indexOf('NUC029KGE') === 0) {
            newChipType = 'NUC029xGE';
        }
        else if (newPartNumber_package.indexOf('NUC029LEE') === 0 || newPartNumber_package.indexOf('NUC029SEE') === 0) {
            newChipType = 'NUC029xEE';
        }
        else if (newPartNumber_package.indexOf('NUC029TAE') === 0) {
            newChipType = 'NUC029TAE';
        }
        else if (newPartNumber_package.indexOf('NUC029') === 0 && newPartNumber_package.indexOf('AE(') !== -1) {
            newChipType = 'NUC029AE';
        }
        else if (newPartNumber_package.indexOf('NUC029') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NUC029AN';
        }
        else if ((newPartNumber_package.indexOf('NANO120') === 0 || newPartNumber_package.indexOf('NANO100') === 0) &&
            newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NANO100AN';
        }
        else if ((newPartNumber_package.indexOf('NANO100') === 0 || newPartNumber_package.indexOf('NANO110') === 0 || newPartNumber_package.indexOf('NANO120') === 0 || newPartNumber_package.indexOf('NANO130') === 0) &&
            newPartNumber_package.indexOf('BN(') !== -1) {
            newChipType = 'NANO100BN';
        }
        else if (newPartNumber_package.indexOf('NANO103') === 0 && newPartNumber_package.indexOf('AE(') !== -1) {
            newChipType = 'NANO103';
        }
        else if (newPartNumber_package.indexOf('NANO1') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NANO112';
        }
        else if (newPartNumber_package.indexOf('NM11') === 0 || newPartNumber_package.indexOf('NM12') === 0) {
            newChipType = 'NM1200';
        }
        else if (newPartNumber_package.indexOf('NM15') === 0) {
            newChipType = 'NM1500';
        }
        else if (newPartNumber_package.indexOf('NUC121') === 0 || newPartNumber_package.indexOf('NUC125') === 0) {
            newChipType = 'NUC121AE';
        }
        else if (newPartNumber_package.indexOf('NUC122') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NUC122AN';
        }
        else if (newPartNumber_package.indexOf('NUC123') === 0 &&
            (newPartNumber_package.indexOf('AE0(') !== -1 || newPartNumber_package.indexOf('AE1(') !== -1 ||
                newPartNumber_package.indexOf('AN0(') !== -1 || newPartNumber_package.indexOf('AN1(') !== -1)) {
            newChipType = 'NUC123AN_AE';
        }
        else if (newPartNumber_package.indexOf('NUC1') === 0 && newPartNumber_package.indexOf('AN(') !== -1) {
            newChipType = 'NUC100AN';
        }
        else if (newPartNumber_package.indexOf('NUC1') === 0 && newPartNumber_package.indexOf('BN(') !== -1) {
            newChipType = 'NUC100BN';
        }
        else if (newPartNumber_package.indexOf('NUC1') === 0 && newPartNumber_package.indexOf('CN(') !== -1) {
            newChipType = 'NUC100CN';
        }
        else if (newPartNumber_package.indexOf('NUC1') === 0 && newPartNumber_package.indexOf('DN(') !== -1) {
            newChipType = 'NUC100DN';
        }
        else if (newPartNumber_package.indexOf('NUC1261') === 0) {
            newChipType = 'NUC1261';
        }
        else if (newPartNumber_package.indexOf('NUC1262') === 0) {
            newChipType = 'NUC1262';
        }
        else if (newPartNumber_package.indexOf('NUC1263') === 0) {
            newChipType = 'NUC1263';
        }
        else if (newPartNumber_package.indexOf('NUC126') === 0) {
            newChipType = 'NUC126';
        }
        else if (newPartNumber_package.indexOf('NUC13') === 0) {
            newChipType = 'NUC131';
        }
        else if (newPartNumber_package.indexOf('NUC505') === 0) {
            newChipType = 'NUC505';
        }
        else if (newPartNumber_package.indexOf('I91') === 0) {
            newChipType = 'ISD9100';
        }
        else if (newPartNumber_package.indexOf('I93') === 0) {
            newChipType = 'ISD9300';
        }
        else if (newPartNumber_package.indexOf('M2003') === 0) {
            newChipType = 'M2003C';
        }
        else {
            newChipType = 'NUC400';
        }

        // using strategy pattern enables an algorithm's behavior to be selected at runtime
        if (newChipType === 'APM32E103xCxE') {
            EMTOOL_APM_CLOCK.setg_chipType(newChipType);
            g_concatenate_generated_code_begin = EMTOOL_APM_CLOCK.concatenate_generated_code_begin;
            g_concatenate_generated_code_internal = EMTOOL_APM_CLOCK.concatenate_generated_code_internal;
            g_concatenate_generated_code_end = EMTOOL_APM_CLOCK.concatenate_generated_code_end;
        }
        else {
            g_concatenate_generated_code_begin = concatenate_generated_code_begin;
            g_concatenate_generated_code_internal = concatenate_generated_code_internal;
            g_concatenate_generated_code_end = concatenate_generated_code_end;
        }

        return newChipType;
    }

    function decideChipTypeAndClockRegs() {
        //window.alert(NUTOOL_CLOCK.g_readConfigFilePath)
        var readConfigFilePath = "",
            saved_newReadConfigFile = "",
            newReadConfigFile = "",
            newPartNumber_package = "",
            newChipType = "",
            newClockRegs = [],
            newClockRegNames = [],
            realClockRegNames = [],
            whileCount = 0,
            oldfilename,
            newfilename,
            newLXTfrequency = "",
            newHXTfrequency = "",
            newPLLfrequency = "",
            newPLL2frequency = "",
            newAPLLfrequency = "",
            newPLLFNfrequency = "",
            newCurrentStep = "",
            regValueString = "",
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            bCorrectChipSeries = false,
            returnToDefaultCase = function () {
                oldfilename = 'NUC_' + g_chipType + '_Content.js';
                // for the case the config.cfg is not existent.
                if (typeof NUTOOL_PER === 'undefined') {
                    g_chipType = 'NUC400';
                    g_partNumber_package = "NUC442JG8AE(LQFP144)";
                }
                else {
                    g_chipType = 'M251';
                    g_partNumber_package = "M251EB2AE(TSSOP28)";
                }
                newChipType = decideNewChipType(g_partNumber_package);
                newfilename = 'NUC_' + newChipType + '_Content.js';
                replacejscssfile(oldfilename, newfilename, 'js', decideClockRegsNamesAndContent);

                window.setTimeout(afterMCUchange, 0); // TODO: Work-around: 處理第一次進入時，clock registers無法顯示的bug
            };

        g_readConfigFile = "";

        saved_newReadConfigFile = newReadConfigFile = NUTOOL_CLOCK.g_readConfigFileContentText;
        // the read config file is empty or undefined. Restore to the default case.
        if (!newReadConfigFile || (/^\s*$/.test(newReadConfigFile))) {
            // default setting
            g_readConfigFile = newReadConfigFile;

            returnToDefaultCase();

            return bCorrectChipSeries;
        }
        else {
            // find the '\r' pertaining to 'MCU:'
            while (newReadConfigFile.indexOf('\r') !== -1 && (newReadConfigFile.indexOf('\r') < newReadConfigFile.indexOf('MCU:'))) {
                newReadConfigFile = newReadConfigFile.sliceAfterX('\r');
            }

            newPartNumber_package = newReadConfigFile.sliceBetweenXandX('MCU:', '\r');
        }

        newChipType = decideNewChipType(newPartNumber_package);
        // check if newChipType is correct
        if ($.inArray(chipTypeToChipSeries(newChipType), g_chipTypes) === -1) {
            showAlertDialog("从配置档读出的晶片型号 " + newChipType + " 不正确。",
                "從配置檔讀出的晶片型號 " + newChipType + " 不正確。",
                "The chip type of " + newChipType + " read from the config file is incorrect.");

            returnToDefaultCase();

            return bCorrectChipSeries;
        }

        // 由於在讀檔時，有先強制replacejscssfile過一次，所以已經換過的話就不用再處理
        if (g_chipType != newChipType) {
            // reload the corresponding chip content
            if (typeof (g_chipType) !== 'undefined' && g_chipType !== "") {
                oldfilename = 'NUC_' + g_chipType + '_Content.js';
                newfilename = 'NUC_' + newChipType + '_Content.js';

                replacejscssfile(oldfilename, newfilename, 'js');
            }
            else {
                if (typeof NUTOOL_PER === 'undefined') {
                    oldfilename = 'NUC_NUC400_Content.js';
                }
                else {
                    oldfilename = 'NUC_M251_Content.js';
                }
                newfilename = 'NUC_' + newChipType + '_Content.js';

                replacejscssfile(oldfilename, newfilename, 'js');
            }
        }

        // read newClockRegs and check if it is correct
        while (newReadConfigFile.indexOf('Reg:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('Reg:');
            regValueString = newReadConfigFile.sliceBetweenXandX('0x', '\r');
            if (!(/^[0-9A-Fa-f]+$/.test(regValueString)) || regValueString.length !== 8) {
                showAlertDialog("从配置档读出的暂存器" + newReadConfigFile.slicePriorToX(' = ') + "的值" + regValueString + "是不正确的。",
                    "從配置檔讀出的暫存器" + newReadConfigFile.slicePriorToX(' = ') + "的值" + regValueString + "是不正確的。",
                    "The value " + regValueString + " of " + newReadConfigFile.slicePriorToX(' = ') + " read from the config file is incorrect.");

                returnToDefaultCase();

                return bCorrectChipSeries;
            }

            newClockRegs[newReadConfigFile.slicePriorToX(' = ')] = parseInt(regValueString, 16);
            //window.alert(newReadConfigFile.slicePriorToX(' = ') + ': = 0x' + newReadConfigFile.slice(newReadConfigFile.indexOf(' = ') + 3, newReadConfigFile.indexOf('\r')))//decimalToHex(newClockRegs[newClockRegs.length])
            newReadConfigFile = newReadConfigFile.slice(1);
            //window.alert(newReadConfigFile)
            if (whileCount > 100) {   // Hank: ?????
                break;
            }
            else {
                whileCount = whileCount + 1;
            }
        }

        if (newReadConfigFile.indexOf('LXT:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('LXT:');
            newLXTfrequency = newReadConfigFile.slicePriorToX('\r');
            if (newLXTfrequency !== '32768' && newLXTfrequency !== '32000') {
                showAlertDialog("从配置档读出的LXT频率是不正确的。",
                    "從配置檔讀出的LXT頻率是不正確的。",
                    "The frequency of LXT read from the config file is incorrect.");

                returnToDefaultCase();

                return bCorrectChipSeries;
            }
        }

        if (newReadConfigFile.indexOf(sHXT + ':') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX(sHXT + ':');
            newHXTfrequency = newReadConfigFile.slicePriorToX('\r');
            if (parseInt(newHXTfrequency, 10) < (parseInt(NUTOOL_CLOCK.g_HXTRange.slicePriorToX('~').slicePriorToX('MHz'), 10) * 1000000) || parseInt(newHXTfrequency, 10) > (parseInt(NUTOOL_CLOCK.g_HXTRange.sliceAfterX('~').slicePriorToX('MHz'), 10) * 1000000)) {
                showAlertDialog("从配置档读出的" + sHXT + "频率是不正确的。",
                    "從配置檔讀出的" + sHXT + "頻率是不正確的。",
                    "The frequency of " + sHXT + " read from the config file is incorrect.");

                returnToDefaultCase();

                return bCorrectChipSeries;
            }
        }

        if (newReadConfigFile.indexOf(sPLL + ':') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX(sPLL + ':');
            newPLLfrequency = newReadConfigFile.slicePriorToX('\r');
        }
        if (newReadConfigFile.indexOf('PLL2:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('PLL2:');
            newPLL2frequency = newReadConfigFile.slicePriorToX('\r');
        }
        if (newReadConfigFile.indexOf('APLL:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('APLL:');
            newAPLLfrequency = newReadConfigFile.slicePriorToX('\r');
        }
        if (newReadConfigFile.indexOf('PLLFN:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('PLLFN:');
            newPLLFNfrequency = newReadConfigFile.slicePriorToX('\r');
        }
        if (newReadConfigFile.indexOf('Step:') !== -1) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('Step:');
            newCurrentStep = newReadConfigFile.slicePriorToX('\r');
            if (parseInt(newCurrentStep, 10) < 1 || parseInt(newCurrentStep, 10) > 4) {
                showAlertDialog("从配置档读出的最後步骤是不正确的。",
                    "從配置檔讀出的最後步驟是不正確的。",
                    "The last step read from the config file is incorrect.");

                returnToDefaultCase();

                return bCorrectChipSeries;
            }
        }
        // get g_readConfigFile
        g_readConfigFile = newReadConfigFile;
        // get g_chipType
        g_chipType = newChipType;
        // get g_partNumber_package
        g_partNumber_package = newPartNumber_package;

        decideClockRegsNamesAndContent(newClockRegs);
        newClockRegNames = getPropertyNames(newClockRegs);
        newClockRegNames.sort();
        realClockRegNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_default);
        realClockRegNames.sort();
        // check if newClockRegs is correct
        if (!realClockRegNames.compare(newClockRegNames)) {
            showAlertDialog("从配置档读出的时脉暂存器里至少一个是不正确的。",
                "從配置檔讀出的暫存器裡至少一個時脈是不正確的。",
                "At least one of the clock registers read from the config file is incorrect.");

            returnToDefaultCase();

            return bCorrectChipSeries;
        }
        $('#ChipTypeSelect').val(chipTypeToChipSeries(g_chipType));

        // get the frequencies of sources
        if (newLXTfrequency !== "") {
            g_realLXToutputClock = parseInt(newLXTfrequency, 10);
        }
        if (newHXTfrequency !== "") {
            g_realHXToutputClock = parseInt(newHXTfrequency, 10);
        }
        if (newPLLfrequency !== "") {
            g_realPLLoutputClock = parseInt(newPLLfrequency, 10);
        }
        if (newPLL2frequency !== "") {
            g_realPLL2outputClock = parseInt(newPLL2frequency, 10);
        }
        if (newAPLLfrequency !== "") {
            g_realAPLLoutputClock = parseInt(newAPLLfrequency, 10);
        }
        if (newPLLFNfrequency !== "") {
            g_realPLLFNoutputClock = parseInt(newPLLFNfrequency, 10);
        }
        if (newCurrentStep !== "") {
            g_finalStep = parseInt(newCurrentStep, 10);
        }

        saveCurrentConfig();

        return bCorrectChipSeries;
    }

    function decideDialogSize() {
        // determine the dialog's size
        // 目前沒存recordedDialogSize，不知道怎麼調整，先都預設為1022*635
        g_Dialog_Width = 1022; // when dpi is 100%
        g_Dialog_Height = 635;

        g_NUC_TreeView_Height = g_Dialog_Height - 8;

        recordedDialogSize = null;
    }

    function decideHotKeys() {
        $(window.document).keypress(function (e) {
            switch (e.which) {
                case 122: // z
                    break;
                case 120: // x
                    break;
                case 99:  // c
                    break;
                case 113: // q
                    break;
                case 119: // w
                    break;
                case 13: // enter
                    // the following should not be removed.
                    g_bPressEnter = true;
                    break;
                default:
                    break;
            }
        });
    }

    function retrieveClockField(fieldName) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fullFieldName,
            tempString,
            returnString = "";


        if (fieldName.indexOf('[') === -1) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                        if (fullFieldName.indexOf('-') === -1) {
                            returnString = clockRegName + '[' + fullFieldName.sliceAfterX(':') + ']';
                        }
                        else {
                            tempString = fullFieldName.sliceAfterX(':');
                            returnString = clockRegName + '[' + tempString.slicePriorToX('-') + ':' + tempString.sliceAfterX('-') + ']';
                        }
                        break;
                    }
                    else if (fullFieldName.indexOf(fieldName.slice(1)) !== -1 && fullFieldName.indexOf(':') === fieldName.length - 1 &&
                        fieldName[0] === '!') {
                        if (fullFieldName.indexOf('-') === -1) {
                            returnString = '!' + clockRegName + '[' + fullFieldName.sliceAfterX(':') + ']';
                        }
                        else {
                            tempString = fullFieldName.sliceAfterX(':');
                            returnString = '!' + clockRegName + '[' + tempString.slicePriorToX('-') + ':' + tempString.sliceAfterX('-') + ']';
                        }
                        break;
                    }
                }
            }
        }
        else {
            returnString = fieldName;
        }

        return returnString;
    }

    function findBusClock(targetModule) {
        var ii,
            maxII,
            jj,
            maxJJ,
            enableFieldName,
            clockRegName,
            fullFieldName1,
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            returnClock = "";

        if ((targetModule !== 'SYSTICK')
            && targetModule.indexOf('CLKO') !== 0 && targetModule.indexOf('CKO') !== 0) {
            enableFieldName = NUTOOL_CLOCK.g_Module[targetModule][1].slicePriorToX('/').toString();

            for (ii = 0, maxII = g_clockRegisterNames.length; ii < maxII; ii += 1) {
                clockRegName = g_clockRegisterNames[ii];
                for (jj = 0, maxJJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; jj < maxJJ; jj += 1) {
                    fullFieldName1 = NUTOOL_CLOCK.g_register_map[clockRegName][jj];
                    if (fullFieldName1.indexOf(enableFieldName) !== -1 && fullFieldName1.indexOf(':') === enableFieldName.length) {
                        if (clockRegName.indexOf('AHB') != -1) {
                            returnClock = "(" + sHCLK + "):" + g_realHCLKoutputClock.toHzString();
                        }
                        else {
                            if ($.inArray(targetModule, NUTOOL_CLOCK.g_BusFromPCLK1) !== -1) {
                                returnClock = "(PCLK1):" + g_realPCLK1outputClock.toHzString();
                            }
                            else if ($.inArray(targetModule, NUTOOL_CLOCK.g_BusFromPCLK2) !== -1) {
                                returnClock = "(PCLK2):" + g_realPCLK2outputClock.toHzString();
                            }
                            else if (g_realPCLK0outputClock !== 0) {
                                returnClock = "(PCLK0):" + g_realPCLK0outputClock.toHzString();
                            }
                            else {
                                returnClock = "(" + sPCLK + "):" + g_realPCLKoutputClock.toHzString();
                            }
                        }
                        break;
                    }
                }
                if (returnClock !== "") {
                    break;
                }
            }
        }
        else { // for SYSTICK and CLKO(CKO)
            returnClock = "(" + sHCLK + "):" + g_realHCLKoutputClock.toHzString();
        }

        return returnClock;
    }

    function hasBusClockOrNot(targetModule) {
        var returnResult;

        if (NUTOOL_CLOCK.g_BusNonExistent.indexOf(targetModule) === -1) {
            returnResult = true;
        }
        else {
            returnResult = false;
        }

        return returnResult;
    }

    function hasEngineClockOrNot(targetModule) {
        var fullFieldName0,
            fullFieldName1,
            returnResult = true,
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString();

        fullFieldName0 = NUTOOL_CLOCK.g_Module[targetModule][0];
        fullFieldName1 = NUTOOL_CLOCK.g_Module[targetModule][2];

        if ((fullFieldName0 === sHCLK ||
            fullFieldName0 === sPCLK ||
            fullFieldName0 === 'PCLK0' ||
            fullFieldName0 === 'PCLK1' ||
            fullFieldName0 === 'PCLK2') &&
            fullFieldName1 === 'none') {
            returnResult = false;
        }

        return returnResult;
    }

    function updateModuleRealFrequency(moduleName, moduleRealFrequency) {
        // for special cases
        if (g_chipType === "APM32E103xCxE" && moduleName.indexOf('TMR') === 0) {
            if (NUTOOL_CLOCK.g_Module[moduleName][0] === 'PCLK1' && getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL.APB1PSEL, readValueFromClockRegs('APB1PSEL')) != 1) {
                moduleRealFrequency *= 2;
            }
            if (NUTOOL_CLOCK.g_Module[moduleName][0] === 'PCLK2' && getDivisorFromArray(NUTOOL_CLOCK.g_CLKSEL.APB1PSEL, readValueFromClockRegs('APB2PSEL')) != 1) {
                moduleRealFrequency *= 2;
            }
        }
        return moduleRealFrequency;
    }

    function updateClockRegsTree() {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            clockRegNameString;

        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            clockRegNameString = clockRegName = g_clockRegisterNames[i];
            if (clockRegNameString.length < g_maxClockRegsStringLength) {
                for (j = 0, maxJ = (g_maxClockRegsStringLength - clockRegNameString.length); j < maxJ; j += 1) {
                    clockRegNameString += g_unPrintedCharacters;
                }
            }
            $("#clockRegsTree").jstree('rename_node', $("#" + clockRegName), clockRegNameString + ':0x' + decimalToHex(g_clockRegs[clockRegName]).toUpperCase());
        }
    }

    function writeNewValueToClockRegs(fieldName, value, specificRegister, g_bNotInvokeUpdateClockRegsTree) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fullFieldName,
            bitPosition,
            bitCount,
            mask,
            backupValue;

        if (!specificRegister) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                        if (fullFieldName.indexOf('-') === -1) {
                            bitPosition = parseInt(fullFieldName.sliceAfterX(':'), 10);
                            mask = (1 << bitPosition) >>> 0;
                            backupValue = (g_clockRegs[clockRegName] & mask) >>> 0;
                            backupValue = g_clockRegs[clockRegName] - backupValue;
                            value = (value << bitPosition) >>> 0;
                            g_clockRegs[clockRegName] = backupValue + value;
                        }
                        else {
                            bitPosition = parseInt(fullFieldName.sliceAfterX('-'), 10);
                            bitCount = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - bitPosition + 1;
                            mask = ((Math.pow(2, bitCount) - 1) << bitPosition) >>> 0;
                            backupValue = (g_clockRegs[clockRegName] & mask) >>> 0;
                            backupValue = g_clockRegs[clockRegName] - backupValue;
                            value = (value << bitPosition) >>> 0;
                            g_clockRegs[clockRegName] = backupValue + value;
                        }
                        break;
                    }
                }
            }
        }
        else {
            for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[specificRegister].length; j < maxJ; j += 1) {
                fullFieldName = NUTOOL_CLOCK.g_register_map[specificRegister][j];
                if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                    if (fullFieldName.indexOf('-') === -1) {
                        bitPosition = parseInt(fullFieldName.sliceAfterX(':'), 10);
                        mask = (1 << bitPosition) >>> 0;
                        backupValue = (g_clockRegs[specificRegister] & mask) >>> 0;
                        backupValue = g_clockRegs[specificRegister] - backupValue;
                        value = (value << bitPosition) >>> 0;
                        g_clockRegs[specificRegister] = backupValue + value;
                    }
                    else {
                        bitPosition = parseInt(fullFieldName.sliceAfterX('-'), 10);
                        bitCount = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - bitPosition + 1;
                        mask = ((Math.pow(2, bitCount) - 1) << bitPosition) >>> 0;
                        backupValue = (g_clockRegs[specificRegister] & mask) >>> 0;
                        backupValue = g_clockRegs[specificRegister] - backupValue;
                        value = (value << bitPosition) >>> 0;
                        g_clockRegs[specificRegister] = backupValue + value;
                    }
                    break;
                }
            }
        }

        if (!g_bNotInvokeUpdateClockRegsTree) {
            updateClockRegsTree();
        }
    }

    function determineIEversion() {
        // 由於IE已經結束營業，所以目前調整為適應Chromium即可。
        g_unPrintedCharacters = '\u000C';
        // get context of canvas
        g_utility.getContext = function (element) {
            return element.getContext("2d");
        };
        g_utility.removeContext = function ($id) {
            $id.remove();
        };
        g_utility.addEvent = function (element, eventName, eventFunction) {
            if (typeof (element) !== 'undefined') {
                element.addEventListener(eventName, eventFunction, false);
            }
        };
        g_utility.triggerEvent = function (id, eventName) {
            if (typeof ($(id)[0]) !== 'undefined') {
                $(id).trigger(eventName);
            }
        };
        $('html').addClass('ie10+');
        if (typeof NUTOOL_PER === 'undefined') {
            replacejscssfile('', 'tabulator/promise-polyfill.js', 'js');
            replacejscssfile('', 'tabulator/js/tabulator.js', 'js');
            replacejscssfile('', 'tabulator/css/tabulator.css', 'css');
            // since IE10+ does not allow conditional include js files in index.htm, we dynamically add them here.
            // replacejscssfile('d3.js', 'd3.js', 'js');
            // replacejscssfile('d3-tip.js', 'd3-tip.js', 'js');
        }

        return false;
    }

    function getPropertyNames(obj) {
        var propertyNames = [],
            index = 0,
            name;

        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                propertyNames[index] = name;
                index += 1;
            }
        }

        index = null;
        name = null;

        return propertyNames;
    }

    function removeAlldialogs() {
        if ($("#warningDialog").is(':visible')) {
            $("#warningDialog").dialog("destroy");
        }
        if ($("#dividerConfigureDialog").is(':visible')) {
            $("#dividerConfigureDialog").dialog("destroy");
        }
        if ($("#warningForSavingDialog").is(':visible')) {
            $("#warningForSavingDialog").dialog("destroy");
        }
        if ($("#languageDialog").is(':visible')) {
            $("#languageDialog").dialog("destroy");
        }
        if ($('#clockConfigureErrorDialog').is(':visible')) {
            $('#clockConfigureErrorDialog').dialog("destroy");
        }
        if ($('#generateCodeDialog').is(':visible')) {
            $('#generateCodeDialog').dialog("destroy");
        }
    }

    function constrainMouseClick() {
        // to constrain mouse cursor to stay within the viewport,
        // we disable the left clicking of the mouse except that users click on the select of ChipTypeSelect and MCUselect.
        $(window.document).mousedown(function (e) {
            e = e || window.event;
            g_clickedElementId = (e.target || e.srcElement).id;

            return this;
        });
    }

    function ce(type, ident, inner, isInput) {
        var el;
        if (!isInput) {
            el = window.document.createElement(type);
            el.innerHTML = inner;
        } else {
            el = window.document.createElement('input');
            el.value = inner;
            el.type = type;
        }
        el.id = ident;
        return el;
    }

    function natualSort(as, bs) {
        // case insensitive, digits to number interpolation
        var a, b, a1, b1, i = 0, L, rx = /(\d+)|(\D+)/g, rd = /\d/;
        if (isFinite(as) && isFinite(bs)) { return as - bs; }
        a = String(as).toLowerCase();
        b = String(bs).toLowerCase();
        if (a === b) { return 0; }
        if (!(rd.test(a) && rd.test(b))) { return a > b ? 1 : -1; }
        a = a.match(rx);
        b = b.match(rx);
        L = a.length > b.length ? b.length : a.length;
        while (i < L) {
            a1 = a[i];
            b1 = b[i];
            i += 1;
            if (a1 !== b1) {
                if (isFinite(a1) && isFinite(b1)) {
                    if (a1.charAt(0) === "0") { a1 = "." + a1; }
                    if (b1.charAt(0) === "0") { b1 = "." + b1; }
                    return a1 - b1;
                }
                else { return a1 > b1 ? 1 : -1; }
            }
        }
        return a.length - b.length;
    }

    function decimalToHex(d, padding) {
        var hex = Number(d).toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 8 : padding;

        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    }

    function isNumberic(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function Line(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    Line.prototype.drawWithArrowheads = function (ctx, bTwoArrowHead) {
        var startRadians,
            endRadians;
        // arbitrary styling
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.lineWidth = 1;

        // draw the line
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        if (bTwoArrowHead) {
            // draw the starting arrowhead
            startRadians = Math.atan((this.y2 - this.y1) / (this.x2 - this.x1));
            startRadians += ((this.x2 > this.x1) ? -90 : 90) * Math.PI / 180;
            this.drawArrowhead(ctx, this.x1, this.y1, startRadians);
        }
        // draw the ending arrowhead
        endRadians = Math.atan((this.y2 - this.y1) / (this.x2 - this.x1));
        endRadians += ((this.x2 > this.x1) ? 90 : -90) * Math.PI / 180;
        this.drawArrowhead(ctx, this.x2, this.y2, endRadians);
    };
    Line.prototype.drawArrowhead = function (ctx, x, y, radians) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate(radians);
        ctx.moveTo(0, 0);
        ctx.lineTo(5, 20);
        ctx.lineTo(-5, 20);
        ctx.closePath();
        ctx.restore();
        ctx.fill();
    };

    function saveCurrentConfig() {
        var i,
            max;
        g_saved_current_clockRegs = [];
        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            g_saved_current_clockRegs[g_clockRegisterNames[i]] = g_clockRegs[g_clockRegisterNames[i]];
        }

        g_saved_currentLIRCoutputClock = g_realLIRCoutputClock;
        g_saved_currentHIRCoutputClock = g_realHIRCoutputClock;
        g_saved_currentHIRC2outputClock = g_realHIRC2outputClock;
        g_saved_currentHIRC48outputClock = g_realHIRC48outputClock;
        g_saved_currentMIRCoutputClock = g_realMIRCoutputClock;
        g_saved_currentMIRC1P2MoutputClock = g_realMIRC1P2MoutputClock;
        g_saved_currentLXToutputClock = g_realLXToutputClock;
        g_saved_currentHXToutputClock = g_realHXToutputClock;
        g_saved_currentPLLoutputClock = g_realPLLoutputClock;
        g_saved_currentPLL2outputClock = g_realPLL2outputClock;
        g_saved_currentAPLLoutputClock = g_realAPLLoutputClock;
        g_saved_currentPLLFNoutputClock = g_realPLLFNoutputClock;
        g_saved_currentHCLKoutputClock = g_realHCLKoutputClock;
        g_saved_currentPCLKoutputClock = g_realPCLKoutputClock;
        g_saved_currentPCLK0outputClock = g_realPCLK0outputClock;
        g_saved_currentPCLK1outputClock = g_realPCLK1outputClock;
        g_saved_currentPCLK2outputClock = g_realPCLK2outputClock;
    }

    function restoreCurrentConfig() {
        var i,
            max;
        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            g_clockRegs[g_clockRegisterNames[i]] = g_saved_current_clockRegs[g_clockRegisterNames[i]];
        }

        g_realLIRCoutputClock = g_saved_currentLIRCoutputClock;
        g_realHIRCoutputClock = g_saved_currentHIRCoutputClock;
        g_realHIRC2outputClock = g_saved_currentHIRC2outputClock;
        g_realHIRC48outputClock = g_saved_currentHIRC48outputClock;
        g_realMIRCoutputClock = g_saved_currentMIRCoutputClock;
        g_realMIRC1P2MoutputClock = g_saved_currentMIRC1P2MoutputClock;
        g_realLXToutputClock = g_saved_currentLXToutputClock;
        g_realHXToutputClock = g_saved_currentHXToutputClock;
        //window.alert('4: ' + g_realHXToutputClock)
        g_realPLLoutputClock = g_saved_currentPLLoutputClock;
        g_realPLL2outputClock = g_saved_currentPLL2outputClock;
        g_realAPLLoutputClock = g_saved_currentAPLLoutputClock;
        g_realPLLFNoutputClock = g_saved_currentPLLFNoutputClock;
        g_realHCLKoutputClock = g_saved_currentHCLKoutputClock;
        g_realPCLKoutputClock = g_saved_currentPCLKoutputClock;
        g_realPCLK0outputClock = g_saved_currentPCLK0outputClock;
        g_realPCLK1outputClock = g_saved_currentPCLK1outputClock;
        g_realPCLK2outputClock = g_saved_currentPCLK2outputClock;
    }

    function initializeAll() {
        g_clockRegs = [];
        g_clockRegisterNames = [];
        g_maxClockRegsStringLength = 0;
        g_realLIRCoutputClock = 0;
        g_realHIRCoutputClock = 0;
        g_realHIRC2outputClock = 0;
        g_realHIRC48outputClock = 0;
        g_realMIRCoutputClock = 0;
        g_realMIRC1P2MoutputClock = 0;
        g_realLXToutputClock = 0;
        g_realHXToutputClock = 0;
        g_realRTC32koutputClock = 0;
        g_realPLLoutputClock = 0;
        g_realPLL2outputClock = 0;
        g_realPLL480MoutputClock = 0;
        g_realAPLLoutputClock = 0;
        g_realPLLFNoutputClock = 0;
        g_realHSUSBOTGPHYoutputClock = 0;
        g_realHCLKoutputClock = 0;
        g_realPCLKoutputClock = 0;
        g_realPCLK0outputClock = 0;
        g_realPCLK1outputClock = 0;
        g_realPCLK2outputClock = 0;
        g_enabledBaseClocks = [];
        g_recordedCheckedNode = "";
        g_bPressEnter = false;
        g_clockRegsString = "";
        g_readConfigFile = "";
        g_finalStep = 1;
        g_svgGroup = null;
        // remove tabs
        $("#tab-1").remove();
        $("#tab-2").remove();
        $("#tab-3").remove();
        $("#tab-4").remove();
        $("#tabs > ul > li").remove();
        // remove tree to release the former one.
        $("#clockRegsTree").jstree('destroy');
        $("#searchModule").jstree('destroy');
        //$("#moduleTree").jstree('destroy');
        $("#clockRegsTree").remove();
        $("#searchModule").remove();
        //$("#moduleTree").remove();

        removeAlldialogs();
    }

    function refresh() {
        $('#ChipType').show();
        $('#MCU').show();
        //$("#tabs").css({ left: g_NUC_TreeView_Width + 8 + 'px' });
        if ($('#clockRegsTree').css('display') !== 'none') {
            $("#tabs").css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            $("#tabs").css({ left: g_NUC_TreeView_Width + 8 + 'px' });
        }
        else {
            $("#tabs").css('width', (g_Dialog_Width - 8) + 'px');
            $("#tabs").css({ left: '0px' });
        }

        if (typeof NUTOOL_PER === 'undefined') {
            buildMCUselect();
        }
        buildClockRegsTree();
        buildRefClockTab();
    }

    function triggerMultiWayConfigure() {
        var i,
            max,
            bMultiWayConfigure = false,
            bMultiWayConfigure1 = false,
            currentActive = $("#tabs").tabs('option', 'active');
        // avoid being invoked by itself
        if (!g_bIsTriggerMultiConfiguring) {
            g_bIsTriggerMultiConfiguring = true;
            if (currentActive + 1 < g_finalStep) {
                for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                    if (g_saved_current_clockRegs[g_clockRegisterNames[i]] !== g_clockRegs[g_clockRegisterNames[i]]) {
                        bMultiWayConfigure = true;
                        break;
                    }
                }

                if (g_saved_currentLIRCoutputClock > 0 && g_saved_currentLIRCoutputClock !== g_realLIRCoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentHIRCoutputClock > 0 && g_saved_currentHIRCoutputClock !== g_realHIRCoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentHIRC2outputClock > 0 && g_saved_currentHIRC2outputClock !== g_realHIRC2outputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentHIRC48outputClock > 0 && g_saved_currentHIRC48outputClock !== g_realHIRC48outputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentMIRCoutputClock > 0 && g_saved_currentMIRCoutputClock !== g_realMIRCoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentMIRC1P2MoutputClock > 0 && g_saved_currentMIRC1P2MoutputClock !== g_realMIRC1P2MoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentLXToutputClock > 0 && g_saved_currentLXToutputClock !== g_realLXToutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentHXToutputClock > 0 && g_saved_currentHXToutputClock !== g_realHXToutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPLLoutputClock > 0 && g_saved_currentPLLoutputClock !== g_realPLLoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPLL2outputClock > 0 && g_saved_currentPLL2outputClock !== g_realPLL2outputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentAPLLoutputClock > 0 && g_saved_currentAPLLoutputClock !== g_realAPLLoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPLLFNoutputClock > 0 && g_saved_currentPLLFNoutputClock !== g_realPLLFNoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentHCLKoutputClock > 0 && g_saved_currentHCLKoutputClock !== g_realHCLKoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPCLKoutputClock > 0 && g_saved_currentPCLKoutputClock !== g_realPCLKoutputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPCLK0outputClock > 0 && g_saved_currentPCLK0outputClock !== g_realPCLK0outputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPCLK1outputClock > 0 && g_saved_currentPCLK1outputClock !== g_realPCLK1outputClock) {
                    bMultiWayConfigure1 = true;
                }
                else if (g_saved_currentPCLK2outputClock > 0 && g_saved_currentPCLK2outputClock !== g_realPCLK2outputClock) {
                    bMultiWayConfigure1 = true;
                }
                // start to configure by the multi-way
                if (bMultiWayConfigure || bMultiWayConfigure1) {
                    if (!g_bSkipShowWarningForTriggerMultiWayConfigure) {
                        showWarningForTriggerMultiWayConfigure(function () { triggerMultiWayConfigure_yes(currentActive); }, function () { triggerMultiWayConfigure_no(currentActive); });
                    }
                    else {
                        triggerMultiWayConfigure_yes(currentActive);
                    }
                }
            }
            g_bIsTriggerMultiConfiguring = false;
        }
    }

    function triggerMultiWayConfigure_yes(currentActive) {
        var i = 0,
            CPUCLKLimit,
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString();

        g_bIsTriggerMultiConfiguring = true;
        saveCurrentConfig(); // Be careful. This should be prior to the series of building tabs.
        $("#tabs")[0].style.visibility = 'hidden';

        for (i = currentActive + 1 + 1; i <= 4; i += 1) {
            $("#li-" + i + "").remove();
            $("#tab-" + i + "").remove();
        }

        g_bNotInvokeUpdateClockRegsTree = true;
        switch (currentActive + 1) {
            case 1:
                if (isFieldBe1(sOSC10K_EN) || isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN') || isFieldBe1(sOSC22M2_EN) ||
                    isFieldBe1('HIRC2EN') || isFieldBe1('HIRC48EN') ||
                    isFieldBe1('MIRCEN') || isFieldBe1('MIRC1P2MEN') ||
                    isFieldBe1(sXTL12M_EN) || isFieldBe1(sXTL32K_EN) || isFieldBe1('LIRC32KEN')) {
                    if (!$('#tab-2')[0] && typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
                        buildPLLclockTab();
                    }
                    else if (!$('#tab-3')[0]) {
                        buildHCLKandPCLKtab();
                    }
                }
                else {
                    if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                        invokeWarningDialog('请至少启用一个时脉源。');
                    }
                    else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                        invokeWarningDialog('請至少啟用一個時脈源。');
                    }
                    else {
                        invokeWarningDialog('Please enable at least one clock source.');
                    }
                }
                break;
            case 2:
                if (!$('#tab-3')[0]) {
                    buildHCLKandPCLKtab();
                }
                break;
            case 3:
                if (!$('#tab-4')[0]) {
                    if (isNumberic(NUTOOL_CLOCK.g_CPUCLKLimit)) {
                        CPUCLKLimit = NUTOOL_CLOCK.g_CPUCLKLimit;
                    }
                    else {
                        CPUCLKLimit = parseInt(NUTOOL_CLOCK.g_CPUCLKLimit[g_partNumber_package.slicePriorToX('(')], 10);
                    }
                    if (g_realHCLKoutputClock > CPUCLKLimit) {
                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                            invokeWarningDialog('CPU频率上限为' + CPUCLKLimit.toHzString() + '。 ' + sHCLK + '频率不应超过其限制。');
                        }
                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                            invokeWarningDialog('CPU頻率上限為' + CPUCLKLimit.toHzString() + '。 ' + sHCLK + '頻率不應超過其限制。');
                        }
                        else {
                            invokeWarningDialog('The upper limit of CPU frequency is ' + CPUCLKLimit.toHzString() + '. The ' + sHCLK + ' frequency should not run beyond the limit.');
                        }
                    }
                    else {
                        buildModuleTab();
                    }
                }
                break;
            default:
                break;
        }

        // finally, do not forget to invoke updateClockRegsTree
        updateClockRegsTree();
        g_bNotInvokeUpdateClockRegsTree = false;

        $("#tabs").tabs({ active: currentActive });

        g_bIsTriggerMultiConfiguring = false;
        $("#tabs")[0].style.visibility = 'visible';
    }

    function triggerMultiWayConfigure_no(currentActive) {
        g_bIsTriggerMultiConfiguring = true;
        restoreCurrentConfig(); // Be careful. This should be prior to the series of building tabs.
        $("#li-" + (currentActive + 1) + "").remove();
        $("#tab-" + (currentActive + 1) + "").remove();

        switch (currentActive + 1) {
            case 1:
                if (!$('#tab-1')[0]) {
                    buildRefClockTab('single');
                }
                break;
            case 2:
                if (!$('#tab-2')[0] && typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
                    buildPLLclockTab();
                }
                else if (!$('#tab-3')[0]) {
                    buildHCLKandPCLKtab();
                }
                break;
            case 3:
                if (!$('#tab-3')[0]) {
                    buildHCLKandPCLKtab('single');
                }
                break;
            default:
                break;
        }

        $("#tabs").tabs({ active: currentActive });

        g_bIsTriggerMultiConfiguring = false;
    }

    function checkForField(fieldName) {
        registerMap = NUTOOL_CLOCK.g_register_map;
        for (const register in registerMap) {
            if (Object.prototype.hasOwnProperty.call(registerMap, register)) {
                const bitFields = registerMap[register];
                for (let i = 0; i < bitFields.length; i++) {
                    if (bitFields[i].includes(fieldName)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function checkClockConfigureCorrectness(showDialog) {
        var errorMessage = "",
            sHCLK = 'HCLK'.toEquivalent().toString(),
            bResult = true;

        if (!isFieldBe1('CLKSRC') && ($("#SYSTICK_span_showRealFreq").text().toFloat() > g_realHCLKoutputClock / 2)) {
            bResult = false;

            if (g_userSelectUIlanguage === "Simplified Chinese") {
                errorMessage = "SysTick的时脉源频率必需小於或等於" + sHCLK + "/2。";
            }
            else if (g_userSelectUIlanguage === "Traditional Chinese") {
                errorMessage = "SysTick的時脈源頻率必需小於或等於" + sHCLK + "/2。";
            }
            else {
                errorMessage = "The clock source of SysTick must be less than or equal to " + sHCLK + "/2.";
            }
        }

        if (!bResult) {
            showDialog(errorMessage);
        }

        return bResult;
    }

    function showWarningForTriggerMultiWayConfigure(okFunction, cancelFunction) {
        var title,
            content,
            okButton,
            cancelButton;
        if (!g_bAvoidClicking) {
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                title = '警告!';
                content = '这样的改变将会影响之前的设定。请问你要继续它吗?<br /><br /><label><input type="checkbox" id = "checkbox_skip"/>暂时略过这个讯息</label>';
                okButton = '要';
                cancelButton = '不要';
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                title = '警告!';
                content = '這樣的改變將會影響之前的設定。請問你要繼續它嗎?<br /><br /><label><input type="checkbox" id = "checkbox_skip"/>暫時略過這個訊息</label>';
                okButton = '要';
                cancelButton = '不要';
            }
            else {
                title = 'Warning!';
                content = 'The modification will influence the prior settings.<br />Would you like to continue it?<br /><br /><label><input type="checkbox" id = "checkbox_skip"/>Skip this message temporarily</label>';
                okButton = 'Yes';
                cancelButton = 'No';
            }

            // close the last dialog
            if ($('#warningForSavingDialog').is(':visible')) {
                $('#warningForSavingDialog').dialog("destroy");
            }

            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            $('<div id="warningForSavingDialog"><p>' + content + '</p><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                .dialog({
                    modal: true,
                    draggable: false,
                    resizable: false,
                    dialogClass: 'no-close',
                    title: title,
                    width: 500,
                    height: 'auto',
                    show: 'fade',
                    hide: 'fade',
                    buttons: [
                        {
                            text: okButton,
                            click: function () {
                                if ($('#checkbox_skip').is(':checked')) {
                                    g_bSkipShowWarningForTriggerMultiWayConfigure = true;
                                }
                                okFunction();
                                if ($(this).is(':visible')) {
                                    $(this).dialog("destroy");
                                }
                            }
                        },
                        {
                            text: cancelButton,
                            click: function () {
                                if ($('#checkbox_skip').is(':checked')) {
                                    g_bSkipShowWarningForTriggerMultiWayConfigure = true;
                                }
                                cancelFunction();
                                if ($(this).is(':visible')) {
                                    $(this).dialog("destroy");
                                }
                            }
                        }
                    ],
                    close: function () {
                        //if ($(this).is(':visible')) {
                        $(this).dialog("destroy");
                        //}
                    }
                });
        }
    }

    function showClockConfigureError(errorMessage) {
        var title,
            content,
            buttonOk;

        if (g_userSelectUIlanguage === "Simplified Chinese") {
            title = "时脉设置错误";
            content = errorMessage;
            buttonOk = "确定";
        }
        else if (g_userSelectUIlanguage === "Traditional Chinese") {
            title = "時脈設置錯誤";
            content = errorMessage;
            buttonOk = "確定";
        }
        else {
            title = "Clock Configure Error";
            content = errorMessage;
            buttonOk = "Confirm";
        }
        // close the last dialog
        if ($('#clockConfigureErrorDialog').is(':visible')) {
            $('#clockConfigureErrorDialog').dialog("destroy");
        }
        // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
        $('<div id="clockConfigureErrorDialog"><p>' + content + '</p><input type="text" size="1" style="position:relative;top:-5000px;"/></div>').dialog({
            modal: false,
            resizable: false,
            title: title,
            width: 500,
            height: 350,
            show: 'fade',
            hide: 'fade',
            buttons: [
                {
                    text: buttonOk,
                    click: function () {
                        // close the last dialog
                        if ($(this).is(':visible')) {
                            $(this).dialog("destroy");
                        }
                    }
                }
            ],
            close: function () {
                $(this).dialog("destroy");
            }
        });
    }

    function showClockConfigureErrorForCloseApp(errorMessage) {
        var i,
            max,
            title,
            content,
            buttonOk,
            buttonCanel;

        if (g_userSelectUIlanguage === "Simplified Chinese") {
            title = "时脉设置错误";
            content = errorMessage +
                "<br /><br />若你仍想要关掉应用程式，请按'关闭'。但所有设置将会回复到初始值。若你想要修正他们，请按'修正'。";
            buttonOk = "关闭";
            buttonCanel = "修正";
        }
        else if (g_userSelectUIlanguage === "Traditional Chinese") {
            title = "時脈設置錯誤";
            content = errorMessage +
                "<br /><br />若你仍想要關掉應用程式，請按'關閉'。但所有設置將會回復到初始值。若你想要修正他們，請按'修正'。";
            buttonOk = "關閉";
            buttonCanel = "修正";
        }
        else {
            title = "Clock Configure Error";
            content = errorMessage +
                "<br /><br />If you still want to close the application, please press Close. But all the configuration will be restored to the default." +
                "If you want to fix them, please press Fix.";
            buttonOk = "Close";
            buttonCanel = "Fix";
        }
        // close the last dialog
        if ($('#clockConfigureErrorDialog').is(':visible')) {
            $('#clockConfigureErrorDialog').dialog("destroy");
        }

        // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
        $('<div id="clockConfigureErrorDialog"><p>' + content + '</p><input type="text" size="1" style="position:relative;top:-5000px;"/></div>').dialog({
            modal: false,
            resizable: false,
            title: title,
            width: 500,
            height: 350,
            show: 'fade',
            hide: 'fade',
            buttons: [
                {
                    text: buttonOk,
                    click: function () {
                        // close the last dialog
                        if ($(this).is(':visible')) {
                            $(this).dialog("destroy");
                        }

                        initializeAll();
                        NUTOOL_CLOCK.g_readConfigFilePath = 'dummyPath';
                        g_clockRegisterNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_default);

                        g_clockRegs = [];
                        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                            g_clockRegs[g_clockRegisterNames[i]] = parseInt(NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]], 16);
                        }
                        saveNu_config();
                    }
                },
                {
                    text: buttonCanel,
                    click: function () {
                        // close the last dialog
                        if ($(this).is(':visible')) {
                            $(this).dialog("destroy");
                        }
                    }
                }
            ],
            close: function () {
                $(this).dialog("destroy");
            }
        });
    }

    function showAlertDialog(SimplifiedChinese, TraditionalChinese, English) {
        if (g_userSelectUIlanguage === "Simplified Chinese") {
            window.alert(SimplifiedChinese);
        }
        else if (g_userSelectUIlanguage === "Traditional Chinese") {
            window.alert(TraditionalChinese);
        }
        else {
            window.alert(English);
        }
    }

    function showWarningForSaving(cancelFunction) {
        var i,
            max,
            bSaved = true,
            title,
            content,
            okButton,
            cancelButton;
        if (typeof NUTOOL_PER !== 'undefined') {
            cancelFunction();
        }
        else if (!g_bAvoidClicking) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                if (g_saved_clockRegs[g_clockRegisterNames[i]] !== g_clockRegs[g_clockRegisterNames[i]]) {
                    bSaved = false;
                    break;
                }
            }

            if (!bSaved) {
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    title = '警告!';
                    content = '配置档已被修改过。请问你要储存它吗?';
                    okButton = '要';
                    cancelButton = '不要';
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    title = '警告!';
                    content = '配置檔已被修改過。請問你要儲存它嗎?';
                    okButton = '要';
                    cancelButton = '不要';
                }
                else {
                    title = 'Warning!';
                    content = 'The configuration has been modified.<br />Would you like to save it?';
                    okButton = 'Yes';
                    cancelButton = 'No';
                }

                // close the last dialog
                if ($('#warningForSavingDialog').is(':visible')) {
                    $('#warningForSavingDialog').dialog("destroy");
                }

                // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
                $('<div id="warningForSavingDialog"><p>' + content + '</p><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                    .dialog({
                        modal: true,
                        draggable: false,
                        resizable: false,
                        title: title,
                        width: 500,
                        height: 'auto',
                        show: 'fade',
                        hide: 'fade',
                        buttons: [
                            {
                                text: okButton,
                                click: function () {
                                    saveConfig();
                                    cancelFunction();
                                    if ($(this).is(':visible')) {
                                        $(this).dialog("destroy");
                                    }
                                }
                            },
                            {
                                text: cancelButton,
                                click: function () {
                                    cancelFunction();
                                    if ($(this).is(':visible')) {
                                        $(this).dialog("destroy");
                                    }
                                }
                            }
                        ],
                        close: function () {
                            $(this).dialog("destroy");
                        }
                    });
            }
            else {
                cancelFunction();
            }
        }
    }

    function invokeWarningDialog(content) {
        var title,
            okButton;
        // close the last dialog
        if ($('#warningDialog').is(':visible')) {
            $('#warningDialog').dialog("destroy");
        }

        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            title = '警告!';
            okButton = '确认';
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            title = '警告!';
            okButton = '確認';
        }
        else {
            title = 'Warning!';
            okButton = 'Confirm';
        }

        // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
        $('<div id="warningDialog"><p>' + content + '</p><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
            .dialog({
                modal: false,
                resizable: false,
                title: title,
                width: 500,
                height: 'auto',
                show: 'fade',
                hide: 'fade',
                buttons: [
                    {
                        text: okButton,
                        click: function () {
                            if ($(this).is(':visible')) {
                                $(this).dialog("destroy");
                            }
                        }
                    }
                ],
                close: function () {
                    $(this).dialog("destroy");
                }
            });
    }

    ///////////////////////////////////////////////////////////for functional test///////////////////////////////////////////////////////////
    function isFieldBe1(fieldName, specificRegister) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fullFieldName,
            bitPosition,
            mask,
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            fieldAlwaysBe1 = {},
            backupValue = 0,
            bReturnValue = false;

        fieldAlwaysBe1[sOSC10K_EN] = ['M030G_31G'];
        fieldAlwaysBe1[sOSC22M_EN] = [];
        fieldAlwaysBe1[sOSC22M2_EN] = [];
        fieldAlwaysBe1.MIRC1P2MEN = ['M258'];
        if (typeof fieldAlwaysBe1[fieldName] !== 'undefined' &&
            fieldAlwaysBe1[fieldName].indexOf(g_chipType) !== -1) {
            backupValue = 1;
        }
        else if (!specificRegister) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                        bitPosition = parseInt(fullFieldName.sliceAfterX(':'), 10);
                        mask = (1 << bitPosition) >>> 0;
                        backupValue = (g_clockRegs[clockRegName] & mask) >>> 0;
                        break;
                    }
                }
            }
        }
        else {
            for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[specificRegister].length; j < maxJ; j += 1) {
                fullFieldName = NUTOOL_CLOCK.g_register_map[specificRegister][j];
                if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                    bitPosition = parseInt(fullFieldName.sliceAfterX(':'), 10);
                    mask = (1 << bitPosition) >>> 0;
                    backupValue = (g_clockRegs[specificRegister] & mask) >>> 0;
                    break;
                }
            }
        }

        if (backupValue !== 0) {
            bReturnValue = true;
        }

        return bReturnValue;
    }

    function isEnabled(fieldName) {
        var bReturnValue;

        if (fieldName.indexOf('!') !== 0) {
            bReturnValue = isFieldBe1(fieldName);
        }
        else {
            bReturnValue = !isFieldBe1(fieldName.sliceAfterX('!'));
        }

        return bReturnValue;
    }

    function initializationByTest() {
        var i,
            max;

        initializeAll();
        // get g_clockRegisterNames
        g_clockRegisterNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_default);
        // get g_clockRegs
        g_clockRegs = [];
        NUTOOL_CLOCK.g_readConfigFilePath = 'dummyPath';

        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            g_clockRegs[g_clockRegisterNames[i]] = parseInt(NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]], 16);
        }

        if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
            g_finalStep = 4;
        }
        else {
            g_finalStep = 3;
        }

        if (g_chipType === "NUC400") {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 84000000;
            }

            if (g_realPLL2outputClock === 0) {
                g_realPLL2outputClock = 240000000;
            }
        }
        if (g_chipType === "NUC505") {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 240000000;
            }

            if (g_realAPLLoutputClock === 0) {
                g_realAPLLoutputClock = 240000000;
            }
        }
        else if (g_chipType.indexOf("M460") === 0) {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 72000000;
            }
            if (g_realPLLFNoutputClock === 0) {
                g_realPLLFNoutputClock = 72000000;
            }
        }
        else if (g_chipType === "M451" || g_chipType.indexOf("M480") === 0) {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 72000000;
            }
        }
        else if (g_chipType === "MINI58") {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 50000000;
            }
        }
        else if (g_chipType === "NANO100AN" || g_chipType === "NANO100BN" ||
            g_chipType === "NUC121AE" || g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 96000000;
            }
        }
        else if (g_chipType === "NUC1262") {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 144000000;
            }
        }
        else if (g_chipType === "NANO112" || g_chipType === "NANO103") {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 16000000;
            }
        }
        else {
            if (g_realPLLoutputClock === 0) {
                g_realPLLoutputClock = 48000000;
            }
        }

        refresh();
    }

    function reportBaseClockFrequencies() {
        var reportMessage = "",
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString();

        if (g_realLIRCoutputClock > 0) {
            reportMessage = sLIRC + ": " + g_realLIRCoutputClock.toHzString();
        }
        if (g_realHIRCoutputClock > 0) {
            reportMessage += " / " + sHIRC + ": " + g_realHIRCoutputClock.toHzString();
        }
        if (g_realHIRC2outputClock > 0) {
            reportMessage += " / " + sHIRC2 + ": " + g_realHIRC2outputClock.toHzString();
        }
        if (g_realHIRC48outputClock > 0) {
            reportMessage += " / HIRC48: " + g_realHIRC48outputClock.toHzString();
        }
        if (g_realMIRCoutputClock > 0) {
            reportMessage += " / MIRC: " + g_realMIRCoutputClock.toHzString();
        }
        if (g_realMIRC1P2MoutputClock > 0) {
            reportMessage += " / MIRC1P2M: " + g_realMIRC1P2MoutputClock.toHzString();
        }
        if (g_realLXToutputClock > 0) {
            reportMessage += " / LXT: " + g_realLXToutputClock.toHzString();
        }
        if (g_realHXToutputClock > 0) {
            reportMessage += " / " + sHXT + ": " + g_realHXToutputClock.toHzString();
        }
        if (g_realRTC32koutputClock > 0) {
            reportMessage += " / RTC32k: " + g_realRTC32koutputClock.toHzString();
        }
        if (g_realPLLoutputClock > 0) {
            reportMessage += " / " + sPLL + ": " + g_realPLLoutputClock.toHzString();
        }
        if (g_realPLL2outputClock > 0) {
            reportMessage += " / PLL2: " + g_realPLL2outputClock.toHzString();
        }
        if (g_realPLL480MoutputClock > 0) {
            reportMessage += " / PLL480M: " + g_realPLL480MoutputClock.toHzString();
        }
        if (g_realAPLLoutputClock > 0) {
            reportMessage += " / APLL: " + g_realAPLLoutputClock.toHzString();
        }
        if (g_realPLLFNoutputClock > 0) {
            reportMessage += " / PLLFN: " + g_realPLLFNoutputClock.toHzString();
        }
        if (g_realHSUSBOTGPHYoutputClock > 0) {
            reportMessage += " / HSUSB_OTG_PHY: " + g_realHSUSBOTGPHYoutputClock.toHzString();
        }
        if (g_realHCLKoutputClock > 0) {
            reportMessage += " / " + sHCLK + ": " + g_realHCLKoutputClock.toHzString();
        }
        if (g_realPCLKoutputClock > 0) {
            reportMessage += " / " + sPCLK + ": " + g_realPCLKoutputClock.toHzString();
        }
        if (g_realPCLK0outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK0SEL'.toEquivalent().toString())) {
            reportMessage += " / PCLK0: " + g_realPCLK0outputClock.toHzString();
        }
        if (g_realPCLK1outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK1SEL'.toEquivalent().toString())) {
            reportMessage += " / PCLK1: " + g_realPCLK1outputClock.toHzString();
        }
        if (g_realPCLK2outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLK2SEL'.toEquivalent().toString())) {
            reportMessage += " / PCLK2: " + g_realPCLK2outputClock.toHzString();
        }

        if (reportMessage.indexOf(' / ') === 0) {
            reportMessage = reportMessage.sliceAfterX(' / ');
        }

        return reportMessage;
    }

    function doubleClickD3Node(node) {
        var event = window.document.createEvent("Event");

        event.initEvent("dblclick", true, true);
        if (typeof node.id !== 'undefined') {
            d3.select('#' + node.id)[0][0].dispatchEvent(event);
        }
        else {
            d3.select('#' + node)[0][0].dispatchEvent(event);
        }
    }

    function dragD3Node(draggingNode, selectedNode) {
        var eventMousedown = window.document.createEvent("Event"),
            eventMousemove = window.document.createEvent("Event"),
            eventMouseup = window.document.createEvent("Event");

        eventMousedown.initEvent("mousedown", true, true);
        eventMousemove.initEvent("mousemove", true, true);
        eventMouseup.initEvent("mouseup", true, true);

        d3.select('#' + draggingNode.id)[0][0].dispatchEvent(eventMousedown);
        d3.select('#' + draggingNode.id)[0][0].dispatchEvent(eventMousemove);
        d3.select('#' + draggingNode.id).select('.ghostCircle').on("mouseover")(d3.select('#' + selectedNode.id)[0][0].__data__);
        d3.select('#' + draggingNode.id)[0][0].dispatchEvent(eventMouseup);
    }

    function clickModuleCanvas(moduleName, index) {
        g_clickIndexByTest = index;
        $('#' + moduleName.id + '_canvas').click();
    }

    function changeDividerDialogInput(dividerField, value) {
        if ($('#dividerConfigureDialog').is(':visible')) {
            $("#" + dividerField + "_input_dialog").val(value);
            $('#dividerConfigureDialog').dialog('option', 'buttons')[0].click();
            //$('#dividerConfigureDialog').dialog("destroy");
        }
    }

    function retrieveNodeTooltip() {
        return g_tooptipContent;
    }

    function retrieveGenerateCodeContent(stage) {
        var returnString;

        if (stage === 0) {
            g_concatenate_generated_code_begin();
        }
        else if (stage === 1) {
            g_generateCodeContent = "";
            g_concatenate_generated_code_internal('functionalTest');
        }
        else if (stage === 2) {
            g_concatenate_generated_code_internal('partial');
        }
        else if (stage === 3) {
            returnString = g_generateCodeContent;
            g_generateCodeContent = "";
        }
        else if (stage === 4) { // for HCLK
            concatenate_generated_code_HCLK();
        }
        else {
            g_concatenate_generated_code_end();
            returnString = g_clockRegsString;
        }

        return returnString;
    }

    function checkD3NodeFrequency(moduleName) {
        var i,
            max,
            selectFieldName,
            selectFieldValue,
            dividerInputValue,
            fullFieldName,
            moduleRealFrequency,
            selectFieldNameExtended,
            selectFieldNameExtendedShiftBit;

        moduleName = moduleName.id;

        // decide dividerInputValue
        dividerInputValue = 0;
        if (NUTOOL_CLOCK.g_Module[moduleName][2] !== 'none') {
            dividerInputValue = readValueFromClockRegs(NUTOOL_CLOCK.g_Module[moduleName][2]);
        }
        // read back selectFieldName
        selectFieldName = "";
        if (moduleName !== 'SYSTICK') {
            selectFieldName = fullFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
            if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(selectFieldName)) {
                selectFieldValue = readValueFromClockRegs(selectFieldName);
            }
            else {
                selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[selectFieldName][0];
                selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                selectFieldValue = readValueFromClockRegs(selectFieldName) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;
            }
            if (selectFieldValue !== -1 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                    if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue.toString()) {
                        selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                        break;
                    }
                }
            }
        }
        else {  // moduleName == SYSTICK
            if (isFieldBe1('CLKSRC')) {
                selectFieldName = 'CPUCLK';
            }
            else {
                fullFieldName = 'STCLK_S'.toEquivalent().toString();
                selectFieldValue = readValueFromClockRegs(fullFieldName).toString();
                if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fullFieldName)) {
                    for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fullFieldName].length; i < max; i += 1) {
                        if (NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].sliceAfterX(':') === selectFieldValue) {
                            selectFieldName = NUTOOL_CLOCK.g_CLKSEL[fullFieldName][i].slicePriorToX(':');
                            break;
                        }
                    }
                }
                else {
                    selectFieldName = NUTOOL_CLOCK.g_Module[moduleName][0];
                }
            }
        }

        // generate the frequency of the module
        if (moduleName === 'CLKO_Divider'.toEquivalent().toString() || moduleName === 'CLKO1_Divider'.toEquivalent().toString()) {
            moduleRealFrequency = decideInputClockFreq(selectFieldName) / Math.pow(2, dividerInputValue + 1);
        }
        else {
            moduleRealFrequency = decideInputClockFreq(selectFieldName) / (dividerInputValue + 1);
        }

        moduleRealFrequency = updateModuleRealFrequency(moduleName, moduleRealFrequency);

        // compare the real output frequency with the result from registers
        if (moduleRealFrequency.toHzString() === $("#" + moduleName + "_span_showRealFreq").text()) {
            return moduleName + " clock is " + $("#" + moduleName + "_span_showRealFreq").text() + '.';
        }
        else {
            return "Failed: " + moduleName + " clock (" + $("#" + moduleName + "_span_showRealFreq").text() + ') is not equal to the result from registers (' + moduleRealFrequency.toHzString() + ').';
        }
    }

    function getDivisorFromArray(arr, value) {
        // Loop through each item in the array
        for (let i = 0; i < arr.length; i++) {
            let item = arr[i];
            // Get the divisor part of the item
            let divisorStr = item.split(":")[1];
            // Convert it to an integer
            let divisorValue = parseInt(divisorStr);
            // Check if the divisor value matches the input value
            if (divisorValue === value) {
                if (item.split(":")[0].indexOf("/") === -1) {
                    // If it matches and no forward slash , return 1
                    return 1;
                }
                    // If it matches, return the divisor part after splitting and parsing
                    return parseFloat(item.split(":")[0].split("/")[1]);
            }
        }
        // If no match found, return null
        return null;
    }

    function readValueFromClockRegs(fieldName, baseIndex = 10) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fullFieldName,
            bitPosition,
            bitCount,
            mask,
            returnValue = -1; // it means nothing happens.

        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            clockRegName = g_clockRegisterNames[i];
            for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                    if (fullFieldName.indexOf('-') === -1) {
                        bitPosition = parseInt(fullFieldName.sliceAfterX(':'), baseIndex);
                        mask = (1 << bitPosition) >>> 0;
                    }
                    else {
                        bitPosition = parseInt(fullFieldName.sliceAfterX('-'), baseIndex);
                        bitCount = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), baseIndex) - bitPosition + 1;
                        mask = ((Math.pow(2, bitCount) - 1) << bitPosition) >>> 0;
                    }
                    returnValue = (g_clockRegs[clockRegName] & mask) >>> 0;
                    returnValue = (returnValue >>> bitPosition) >>> 0;
                    break;
                }
            }
        }

        return returnValue;
    }

    function uncheckAllNodes_core() {
        var i,
            j,
            max,
            maxJ,
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module),
            currentNode,
            enableField,
            enableFieldArray = [],
            whileCount = 0,
            bChecked = true;

        g_bNotInvokeUpdateClockRegsTree = true;
        for (i = 0, max = moduleNames.length; i < max; i += 1) {
            currentNode = moduleNames[i];
            enableField = NUTOOL_CLOCK.g_Module[currentNode][1];
            enableFieldArray = [];
            whileCount = 0;
            if (enableField.indexOf('/') === -1) {
                enableFieldArray.push(enableField);
            }
            else {
                while (enableField.indexOf('/') !== -1) {
                    enableFieldArray.push(enableField.slicePriorToX('/'));
                    enableField = enableField.sliceAfterX('/');

                    whileCount = whileCount + 1;
                    if (whileCount > 10) {
                        break;
                    }
                }

                enableFieldArray.push(enableField);
            }
            bChecked = true;
            for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                if (!isEnabled(enableFieldArray[j])) {
                    bChecked = false;
                    break;
                }
            }

            if (bChecked) {
                doubleClickD3Node(currentNode);
            }
        }
        // finally, do not forget to invoke updateClockRegsTree
        updateClockRegsTree();
        g_bNotInvokeUpdateClockRegsTree = false;
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function decideUIlanguage() {
        var recordedUIlanguage = localStorage.getItem("UIlanguage");

        if (typeof (recordedUIlanguage) == 'undefined' || recordedUIlanguage == null) {
            g_userSelectUIlanguage = "English";
        } else {
            g_userSelectUIlanguage = recordedUIlanguage;
        }
        recordedUIlanguage = null;
    }

    function concatenate_generated_code_begin(command) {
        var i,
            j,
            max,
            maxJ,
            currentNode,
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module),
            mask,
            beginningClockRegs,
            local_maxClockRegsStringLength,
            sIncludeHeaderFile,
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sHXTWAIT = 'HXTWAIT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString(),
            sHIRC = 'HIRC'.toEquivalent().toString(),
            sHIRC2 = 'HIRC2'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sPCLK = 'PCLK'.toEquivalent().toString(),
            sPWRCON = 'PWRCON'.toEquivalent().toString(),
            sPLLCON = 'PLLCON'.toEquivalent().toString(),
            sHCLK_S = 'HCLK_S'.toEquivalent().toString(),
            sPCLK_S = 'PCLK_S'.toEquivalent().toString(),
            sPCLK0SEL = 'PCLK0SEL'.toEquivalent().toString(),
            sPCLK1SEL = 'PCLK1SEL'.toEquivalent().toString(),
            sPCLK2SEL = 'PCLK2SEL'.toEquivalent().toString(),
            sHCLK_N = 'HCLK_N'.toEquivalent().toString(),
            sPCLK_N = 'PCLK_N'.toEquivalent().toString(),
            sOSC10K_EN = 'OSC10K_EN'.toEquivalent().toString(),
            sOSC22M_EN = 'OSC22M_EN'.toEquivalent().toString(),
            sOSC22M2_EN = 'OSC22M2_EN'.toEquivalent().toString(),
            sXTL32K_EN = 'XTL32K_EN'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            sEnableModule = "Enabled-Module Frequencies:\n",
            addBitOrOperator,
            generateMainCode,
            fullFieldName,
            selectFieldName,
            selectFieldValue,
            theCode = "",
            theCode1 = "",
            theCode2 = "",
            theCode3 = "",
            tableData,
            tableDataArray = [],
            tempValue,
            enableField,
            enableFieldArray = [],
            enableFieldDefines = [],
            statusFieldDefines = [],
            whileCount,
            bChecked;

        if (typeof command === 'undefined') {
            command = "default";
        }

        addBitOrOperator = function (originalCode, addedCode) {
            if (originalCode === "") {
                originalCode = addedCode;
            }
            else {
                originalCode += '|' + addedCode;
            }

            return originalCode;
        };

        generateMainCode = function () {
            theCode = "";
            if (typeof NUTOOL_PER === 'undefined') {
                theCode += '    /* If the macros do not exist in your project, please refer to the related clk.h in Header folder of the tool package */\n';
            }
            if (g_chipType.indexOf("M480") === 0) {
                theCode += '    /* Set XT1_OUT(PF.2) and XT1_IN(PF.3) to input mode */\n    PF->MODE &= ~(GPIO_MODE_MODE2_Msk | GPIO_MODE_MODE3_Msk);\n\n';
            }
            if (readValueFromClockRegs('HIRC1EN') !== -1 || readValueFromClockRegs('HIRC_FSEL') !== -1) {
                theCode += '    /* Select clock source */\n';
                bChecked = false;
                if (readValueFromClockRegs('HIRC_FSEL') !== -1 && isFieldBe1(sOSC22M_EN)) {
                    if (g_chipType === "NANO112") {
                        if (isFieldBe1('HIRC_FSEL')) {
                            theCode += '    CLK->PWRCTL = CLK->PWRCTL | CLK_PWRCTL_HIRC_FSEL_Msk;\n';
                        }
                        else {
                            theCode += '    CLK->PWRCTL = CLK->PWRCTL & ~CLK_PWRCTL_HIRC_FSEL_Msk;\n';
                        }
                    }
                    else { // NANO103
                        if (isFieldBe1('HIRC_FSEL')) {
                            theCode += '    CLK->PWRCTL = CLK->PWRCTL | CLK_PWRCTL_HIRC0FSEL_Msk;\n';
                        }
                        else {
                            theCode += '    CLK->PWRCTL = CLK->PWRCTL & ~CLK_PWRCTL_HIRC0FSEL_Msk;\n';
                        }
                    }
                    bChecked = true;
                }
                if (readValueFromClockRegs('HIRC1EN') !== -1 && (isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN'))) {
                    if (isFieldBe1(sOSC22M_EN)) {
                        theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 & ~CLK_CLKSEL0_HIRCSEL_Msk;\n';
                    }
                    else {
                        theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 | CLK_CLKSEL0_HIRCSEL_Msk;\n';
                    }
                    bChecked = true;
                }
                if (bChecked) {
                    theCode += '\n';
                }
            }

            for (i = 0, max = beginningClockRegs.length; i < max; i += 1) {
                currentNode = generateCodeRegNameAndMask(beginningClockRegs[i]);
                mask = currentNode.sliceAfterX('/');
                currentNode = currentNode.slicePriorToX('/');

                if (beginningClockRegs[i] === 'RTC_LXTCTL') {
                    if (g_chipType === "M2354") {
                        if (isFieldBe1(sXTL32K_EN)) {
                            theCode += '    /* LXT source from external LXT */\n    CLK_EnableModuleClock(RTC_MODULE);\n    RTC->LXTCTL &= ~(RTC_LXTCTL_LIRC32KEN_Msk|RTC_LXTCTL_C32KSEL_Msk);\n    CLK_DisableModuleClock(RTC_MODULE);\n\n';
                        }
                        if (isFieldBe1('LIRC32KEN')) {
                            theCode += '    /* LXT source from LIRC32K */\n    CLK_EnableModuleClock(RTC_MODULE);\n    RTC->LXTCTL |= (RTC_LXTCTL_LIRC32KEN_Msk|RTC_LXTCTL_C32KSEL_Msk);\n    CLK_DisableModuleClock(RTC_MODULE);\n\n';
                        }
                    }
                    else {
                        if (isFieldBe1(sXTL32K_EN)) {
                            theCode += '    /* LXT source from external LXT */\n    CLK_EnableModuleClock(RTC_MODULE);\n    RTC->LXTCTL &= ~(RTC_LXTCTL_LIRC32KEN_Msk|RTC_LXTCTL_C32KS_Msk);\n    CLK_DisableModuleClock(RTC_MODULE);\n\n';
                        }
                        if (isFieldBe1('LIRC32KEN')) {
                            theCode += '    /* LXT source from LIRC32K */\n    CLK_EnableModuleClock(RTC_MODULE);\n    RTC->LXTCTL |= (RTC_LXTCTL_LIRC32KEN_Msk|RTC_LXTCTL_C32KS_Msk);\n    CLK_DisableModuleClock(RTC_MODULE);\n\n';
                        }
                    }
                }
                if (beginningClockRegs[i] === 'RTC_CLKSRC') {
                    if (isFieldBe1('RTCSEL')) {
                        theCode += '    /* RTC32k source from internal */\n    RTC_SetClockSource(RTC_CLKSRC_INTERNAL);\n\n';
                    }
                    else {
                        theCode += '    /* RTC32k source from external */\n    RTC_SetClockSource(RTC_CLKSRC_EXTERNAL);\n\n';
                    }
                }
                if (beginningClockRegs[i] === sPWRCON) {
                    theCode1 = "";
                    theCode2 = "";
                    if (isFieldBe1(sOSC10K_EN)) {
                        if (typeof enableFieldDefines[0] !== 'undefined' &&
                            enableFieldDefines[0] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[0]);
                        }
                        if (typeof statusFieldDefines[0] !== 'undefined' &&
                            statusFieldDefines[0] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[0]);
                        }
                    }
                    if (isFieldBe1(sOSC22M_EN)) {
                        if (typeof enableFieldDefines[1] !== 'undefined' &&
                            enableFieldDefines[1] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[1]);
                        }
                        if (typeof statusFieldDefines[1] !== 'undefined' &&
                            statusFieldDefines[1] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[1]);
                        }
                    }
                    if (isFieldBe1(sXTL32K_EN)) {
                        if (typeof enableFieldDefines[2] !== 'undefined' &&
                            enableFieldDefines[2] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[2]);
                        }
                        if (typeof statusFieldDefines[2] !== 'undefined' &&
                            statusFieldDefines[2] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[2].slicePriorToLastX('/'));
                        }
                    }
                    if (isFieldBe1('LIRC32KEN')) {
                        if (typeof statusFieldDefines[2] !== 'undefined' &&
                            statusFieldDefines[2] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[2].sliceAfterX('/'));
                        }
                    }
                    if (isFieldBe1(sXTL12M_EN)) {
                        if (typeof enableFieldDefines[3] !== 'undefined' &&
                            enableFieldDefines[3] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[3]);
                        }
                        if (typeof statusFieldDefines[3] !== 'undefined' &&
                            statusFieldDefines[3] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[3]);
                        }
                    }
                    if (isFieldBe1('HIRC1EN')) {
                        if (typeof enableFieldDefines[4] !== 'undefined' &&
                            enableFieldDefines[4] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[4]);
                        }
                        if (typeof statusFieldDefines[5] !== 'undefined' &&
                            statusFieldDefines[5] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[5]);
                        }
                    }
                    if (isFieldBe1('HIRC48EN')) {
                        if (typeof enableFieldDefines[4] !== 'undefined' &&
                            enableFieldDefines[4] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[4]);
                        }
                        if (typeof statusFieldDefines[5] !== 'undefined' &&
                            statusFieldDefines[5] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[5]);
                        }
                    }
                    if (isFieldBe1('MIRCEN')) {
                        if (typeof enableFieldDefines[5] !== 'undefined' &&
                            enableFieldDefines[5] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[5]);
                        }
                        if (typeof statusFieldDefines[6] !== 'undefined' &&
                            statusFieldDefines[6] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[6]);
                        }
                    }
                    if (isFieldBe1('MIRC1P2MEN')) {
                        if (typeof enableFieldDefines[6] !== 'undefined' &&
                            enableFieldDefines[6] !== 'none') {
                            theCode1 = addBitOrOperator(theCode1, enableFieldDefines[6]);
                        }
                        if (typeof statusFieldDefines[7] !== 'undefined' &&
                            statusFieldDefines[7] !== 'none') {
                            theCode2 = addBitOrOperator(theCode2, statusFieldDefines[7]);
                        }
                    }
                    if (theCode1 !== "") {
                        if (g_chipType === 'NUC505') {
                            theCode += '    /* Enable clock source */\n    CLK->PWRCTL |= ' + theCode1 + ';\n\n';
                        }
                        else if (theCode1.indexOf('(') !== -1 && theCode1.indexOf(');') !== -1) {
                            if (theCode1.indexOf('Disable') !== -1) {
                                theCode += '    /* Disable clock source */\n    ' + theCode1 + '\n\n';
                            }
                            else {
                                theCode += '    /* Enable clock source */\n    ' + theCode1 + '\n\n';
                            }
                        }
                        else {
                            theCode += '    /* Enable clock source */\n    CLK_EnableXtalRC(' + theCode1 + ');\n\n';
                        }
                    }
                    if (theCode2 !== "") {
                        if (theCode2.indexOf('(') !== -1 && theCode2.indexOf(');') !== -1) {
                            theCode += '    /* Waiting for clock source ready */\n    ' + theCode2 + '\n\n';
                        }
                        else {
                            theCode += '    /* Waiting for clock source ready */\n    CLK_WaitClockReady(' + theCode2 + ');\n\n';
                        }
                    }
                }
                if (beginningClockRegs[i] === sPLLCON &&
                    typeof NUTOOL_CLOCK.g_register_map[sPLLCON] !== 'undefined') {
                    if (!isFieldBe1('PD') &&
                        _.filter(NUTOOL_CLOCK.g_register_map[sPLLCON], function (s) { return s.indexOf('PD' + ':') !== -1; }).length !== 0) {
                        theCode += '    /* Disable ' + sPLL + ' first to avoid unstable when setting ' + sPLL + ' */\n';
                        theCode += '    CLK_DisablePLL();\n\n';
                        theCode += '    /* Set ' + sPLL + ' frequency */\n';
                        theCode += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[beginningClockRegs[i]]).toUpperCase() + 'UL;\n\n';
                        if (statusFieldDefines[4] !== "none") {
                            theCode += '    /* Waiting for ' + sPLL + ' ready */\n    CLK_WaitClockReady(' + statusFieldDefines[4] + ');\n\n';
                        }
                    }
                }
                if (beginningClockRegs[i] === 'APLLCTL' &&
                    typeof NUTOOL_CLOCK.g_register_map.APLLCTL !== 'undefined' &&
                    !isFieldBe1('APD')) {
                    theCode += '    /* Disable APLL first to avoid unstable when setting APLL */\n';
                    theCode += '    CLK->PLLCTL |= CLK_APLLCTL_PD_Msk;\n\n';
                    theCode += '    /* Set APLL frequency */\n';
                    theCode += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[beginningClockRegs[i]]).toUpperCase() + 'UL;\n\n';
                }
                if ((beginningClockRegs[i] === 'PLLFNCTL0' || beginningClockRegs[i] === 'PLLFNCTL1') &&
                    typeof NUTOOL_CLOCK.g_register_map.PLLFNCTL0 !== 'undefined' &&
                    !isFieldBe1('PDFN')) {
                    theCode += '    /* Disable PLLFN first to avoid unstable when setting PLLFN */\n';
                    theCode += '    CLK->PLLCTL |= CLK_PLLFNCTL1_PD_Msk;\n\n';
                    theCode += '    /* Set PLLFN frequency */\n';
                    theCode += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[beginningClockRegs[i]]).toUpperCase() + 'UL;\n\n';
                }
                if (beginningClockRegs[i] === 'PLL2CTL' &&
                    typeof NUTOOL_CLOCK.g_register_map.PLL2CTL !== 'undefined' &&
                    isFieldBe1('PLL2CKEN')) {
                    theCode += '    /* Set PLL2 frequency */\n';
                    theCode += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[beginningClockRegs[i]]).toUpperCase() + 'UL;\n\n';
                    theCode += '    /* Waiting for PLL2 ready */\n    CLK_WaitClockReady(CLK_STATUS_PLL2STB_Msk);\n\n';
                }
            }

            // for HCLK
            theCode += '    /* Set HCLK clock */\n    CLK_SetHCLK(' + getFieldDefine(sHCLK, sHCLK_S, sHCLK_N) + ');\n\n';
            // for PCLK, PCLK0, and PCLK1 and PCLK2
            if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL)) {
                if (g_chipType !== "M2354") {
                    theCode += '    /* Set PCLK-related clock */\n';
                }
                if (g_chipType.indexOf("M480") === 0 || g_chipType.indexOf("M46") === 0) {
                    tempValue = readValueFromClockRegs(sPCLK0SEL);
                    theCode += '    CLK->PCLKDIV = (CLK_PCLKDIV_PCLK0DIV' + Math.pow(2, tempValue) + ' | ';
                    tempValue = readValueFromClockRegs(sPCLK1SEL);
                    theCode += 'CLK_PCLKDIV_PCLK1DIV' + Math.pow(2, tempValue) + ');\n\n';
                }
                else if (g_chipType.indexOf("M25") === 0 || g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) {
                    tempValue = readValueFromClockRegs(sPCLK0SEL);
                    theCode += '    CLK->PCLKDIV = (CLK_PCLKDIV_APB0DIV_DIV' + Math.pow(2, tempValue) + ' | ';
                    tempValue = readValueFromClockRegs(sPCLK1SEL);
                    theCode += 'CLK_PCLKDIV_APB1DIV_DIV' + Math.pow(2, tempValue) + ');\n\n';
                }
                else if (g_chipType === "M2351" || g_chipType === "M261") {
                    tempValue = readValueFromClockRegs(sPCLK0SEL);
                    if (tempValue === 0) {
                        theCode += '    CLK->PCLKDIV = (CLK_PCLKDIV_APB0DIV_HCLK | ';
                    }
                    else {
                        theCode += '    CLK->PCLKDIV = (CLK_PCLKDIV_APB0DIV_HCLK_DIV' + Math.pow(2, tempValue) + ' | ';
                    }
                    tempValue = readValueFromClockRegs(sPCLK1SEL);
                    if (tempValue === 0) {
                        theCode += 'CLK_PCLKDIV_APB1DIV_HCLK);\n\n';
                    }
                    else {
                        theCode += 'CLK_PCLKDIV_APB1DIV_HCLK_DIV' + Math.pow(2, tempValue) + ');\n\n';
                    }
                }
                else if (g_chipType === "M2354") {
                    // nothing
                }
                else if (g_chipType === "M2003C") {
                    tempValue = readValueFromClockRegs(sPCLK0SEL);
                    theCode += '    CLK->PCLKDIV = (CLK_PCLKDIV_APB0DIV_DIV' + Math.pow(2, tempValue) + ' | ';
                    tempValue = readValueFromClockRegs(sPCLK1SEL);
                    theCode += 'CLK_PCLKDIV_APB1DIV_DIV' + Math.pow(2, tempValue) + ' | ';
                    tempValue = readValueFromClockRegs(sPCLK2SEL);
                    theCode += 'CLK_PCLKDIV_APB2DIV_DIV' + Math.pow(2, tempValue) + ');\n\n';
                }
                else {
                    if (NUTOOL_CLOCK.g_CLKSEL[sPCLK0SEL].length <= 2) {
                        if (isFieldBe1(sPCLK0SEL)) {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 | CLK_CLKSEL0_PCLK0SEL_Msk;\n';
                        }
                        else {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 & ~CLK_CLKSEL0_PCLK0SEL_Msk;\n';
                        }
                    }
                    else {
                        tempValue = readValueFromClockRegs(sPCLK0SEL);
                        if (tempValue === 0) {
                            theCode += '    CLK_SetPCLK0(CLK_APB0DIV_HCLK);\n';
                        }
                        else {
                            theCode += '    CLK_SetPCLK0(CLK_APB0DIV_1_' + Math.pow(2, tempValue) + 'HCLK);\n';
                        }
                    }
                    if (NUTOOL_CLOCK.g_CLKSEL[sPCLK1SEL].length <= 2) {
                        if (isFieldBe1(sPCLK1SEL)) {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 | CLK_CLKSEL0_PCLK1SEL_Msk;\n\n';
                        }
                        else {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 & ~CLK_CLKSEL0_PCLK1SEL_Msk;\n\n';
                        }
                    }
                    else {
                        tempValue = readValueFromClockRegs(sPCLK1SEL);
                        if (tempValue === 0) {
                            theCode += '    CLK_SetPCLK1(CLK_APB1DIV_HCLK);\n\n';
                        }
                        else {
                            theCode += '    CLK_SetPCLK1(CLK_APB1DIV_1_' + Math.pow(2, tempValue) + 'HCLK);\n\n';
                        }
                    }
                    if (NUTOOL_CLOCK.g_CLKSEL[sPCLK2SEL].length <= 2) {
                        if (isFieldBe1(sPCLK2SEL)) {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 | CLK_CLKSEL0_PCLK2SEL_Msk;\n\n';
                        }
                        else {
                            theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 & ~CLK_CLKSEL0_PCLK2SEL_Msk;\n\n';
                        }
                    }
                    else {
                        tempValue = readValueFromClockRegs(sPCLK2SEL);
                        if (tempValue === 0) {
                            theCode += '    CLK_SetPCLK2(CLK_APB1DIV_HCLK);\n\n';
                        }
                        else {
                            theCode += '    CLK_SetPCLK2(CLK_APB1DIV_1_' + Math.pow(2, tempValue) + 'HCLK);\n\n';
                        }
                    }
                }
            }
            else if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK_S)) {
                theCode += '    /* Set PCLK-related clock */\n';
                if (g_chipType === "NUC123AN_AE") {
                    if (isFieldBe1(sPCLK_S)) {
                        theCode += '    CLK->APBDIV = CLK->APBDIV | CLK_APBDIV_APBDIV_Msk;\n\n';
                    }
                    else {
                        theCode += '    CLK->APBDIV = CLK->APBDIV & ~CLK_APBDIV_APBDIV_Msk;\n\n';
                    }
                }
                else if (g_chipType === "NANO112") {
                    theCode += '    CLK->APB_DIV = 0x' + decimalToHex(readValueFromClockRegs(sPCLK_S)).toUpperCase() + 'UL;\n\n';

                }
                else {//NUC400
                    if (isFieldBe1(sPCLK_S)) {
                        theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 | CLK_CLKSEL0_PCLKSEL_Msk;\n\n';
                    }
                    else {
                        theCode += '    CLK->CLKSEL0 = CLK->CLKSEL0 & ~CLK_CLKSEL0_PCLKSEL_Msk;\n\n';
                    }
                }
            }
            else if (readValueFromClockRegs(sPCLK_N) !== -1) { //NUC505
                theCode += '    /* Set PCLK divider */\n';
                theCode += '    CLK_SetModuleClock(PCLK_MODULE, CLK_CLKDIV0_PCLK(' + (readValueFromClockRegs(sPCLK_N) + 1) + '), 1);\n\n';
            }

            return theCode;
        };

        // Difference occurs
        g_bHasBSPtoSupport = true;
        if (g_chipType === "M451") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M451Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType.indexOf('M460') === 0) {
            beginningClockRegs = [sPWRCON, sPLLCON, 'PLLFNCTL0', 'PLLFNCTL1'];
            sIncludeHeaderFile = '#include "M460.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48MEN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48MSTB_Msk', 'none'];
        }
        else if (g_chipType === "M480MD") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M480.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "M480LD") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M480.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48MEN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48MSTB_Msk', 'none'];
        }
        else if (g_chipType === "M2351") {
            beginningClockRegs = ['RTC_LXTCTL', sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M2351.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk/CLK_STATUS_LIRC32STB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'none'];
        }
        else if (g_chipType === "M2354") {
            beginningClockRegs = ['RTC_LXTCTL', sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M2354.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'CLK_PWRCTL_MIRCEN_Msk', 'CLK_PWRCTL_MIRC1P2MEN_Msk'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk/CLK_STATUS_LIRC32STB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'CLK_STATUS_MIRCSTB_Msk', 'none'];
        }
        else if (g_chipType === "M253") {
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "M253.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'CLK_PWRCTL_MIRCEN_Msk'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', '', 'none', 'CLK_STATUS_MIRCSTB_Msk'];
        }
        else if (g_chipType.indexOf("M25") === 0) {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M251.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'CLK_PWRCTL_MIRCEN_Msk'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'CLK_STATUS_MIRCSTB_Msk'];
        }
        else if (g_chipType === "M261") {
            beginningClockRegs = ['RTC_LXTCTL', sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M261.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk/CLK_STATUS_LIRC32STB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'none'];
        }
        else if (g_chipType.indexOf('M030G') === 0) {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M030G.h"';
            enableFieldDefines = ['none', 'CLK_PWRCTL_HIRCEN_Msk', 'none', 'none', 'none', 'none'];
            statusFieldDefines = ['none', 'CLK_STATUS_HIRCSTB_Msk', 'none', 'none', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType.indexOf('M031') === 0) {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M031Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "M051AN" || g_chipType === "M051BN" || g_chipType === "M051DN" || g_chipType === "M051DE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M051Series.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'none', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'none', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "M058S") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M058S.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'none', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'none', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "M0518") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M0518.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "M0519") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M0519.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'none', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'none', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC100AN" || g_chipType === "NUC100BN" || g_chipType === "NUC100DN") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC100Series.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC131") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC131.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC121AE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC121.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN', 'CLK_PWRCTL_HXTEN', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC122AN") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC122.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC123AN_AE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC123.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'none', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'none', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType.indexOf("NUC126") === 0) {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "' + g_chipType + '.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'none'];
        }
        else if (g_chipType === "M0564") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "M0564.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'none'];
        }
        else if (g_chipType === "NUC2201") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC2201.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'CLK_PWRCON_OSC48M_EN_Msk', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'CLK_CLKSTATUS_OSC48M_STB_Msk', 'none'];
        }
        else if (g_chipType === "NUC029AN" || g_chipType === "NUC029TAE" || g_chipType === "NUC029ZAN") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC029xAN.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'none', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'none', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC029xDE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC029xDE.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC029xEE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC029xEE.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'CLK_PWRCON_OSC48M_EN_Msk', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'CLK_CLKSTATUS_OSC48M_STB_Msk', 'none'];
        }
        else if (g_chipType === "NUC029xGE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC029xGE.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC48EN_Msk', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC48STB_Msk', 'none'];
        }
        else if (g_chipType === "NUC200AN") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC200Series.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NUC200AE") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC230_240.h"';
            enableFieldDefines = ['CLK_PWRCON_OSC10K_EN_Msk', 'CLK_PWRCON_OSC22M_EN_Msk', 'CLK_PWRCON_XTL32K_EN_Msk', 'CLK_PWRCON_XTL12M_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_OSC10K_STB_Msk', 'CLK_CLKSTATUS_OSC22M_STB_Msk', 'CLK_CLKSTATUS_XTL32K_STB_Msk', 'CLK_CLKSTATUS_XTL12M_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "MINI57") {
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "Mini57Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXT_EN', 'CLK_PWRCTL_HXT_EN', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_XTLSTB_Msk', 'CLK_STATUS_XTLSTB_Msk', 'none', 'none', 'none'];
        }
        else if (g_chipType === "MINI58") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "Mini58Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_XTLEN_LXT', 'CLK_PWRCTL_XTLEN_HXT', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_XTLSTB_Msk', 'CLK_STATUS_XTLSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NANO100AN" || g_chipType === "NANO100BN") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "Nano100Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRC_EN_Msk', 'CLK_PWRCTL_HIRC_EN_Msk', 'CLK_PWRCTL_LXT_EN_Msk', 'CLK_PWRCTL_HXT_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_LIRC_STB_Msk', 'CLK_CLKSTATUS_HIRC_STB_Msk', 'CLK_CLKSTATUS_LXT_STB_Msk', 'CLK_CLKSTATUS_HXT_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NANO112") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "Nano1X2Series.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRC_EN_Msk', 'CLK_PWRCTL_HIRC_EN_Msk', 'CLK_PWRCTL_LXT_EN_Msk', 'CLK_PWRCTL_HXT_EN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_CLKSTATUS_LIRC_STB_Msk', 'CLK_CLKSTATUS_HIRC_STB_Msk', 'CLK_CLKSTATUS_LXT_STB_Msk', 'CLK_CLKSTATUS_HXT_STB_Msk', 'CLK_CLKSTATUS_PLL_STB_Msk', 'none', 'none'];
        }
        else if (g_chipType === "NANO103") {
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "Nano103.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRC0EN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'CLK_PWRCTL_HIRC1EN_Msk', 'CLK_PWRCTL_MIRCEN_Msk'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRC0STB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'CLK_STATUS_HIRC1STB_Msk', 'CLK_STATUS_MIRCSTB_Msk'];
        }
        else if (g_chipType === "NUC505") {
            beginningClockRegs = ['RTC_CLKSRC', sPWRCON, sPLLCON, 'APLLCTL'];
            sIncludeHeaderFile = '#include "NUC505Series.h"';
            enableFieldDefines = ['none', 'none', 'none', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'none'];
            statusFieldDefines = ['none', 'none', 'none', 'none', 'none', 'none'];
        }
        else if (g_chipType === "MINI51AN") {
            // CLK_EnableModuleClock is unable to configure modules on the AHBCLK.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "Mini51.h"';

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "MINI51DE") {
            // CLK_EnableModuleClock is unable to configure modules on the AHBCLK.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "Mini51Series.h"';

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "MINI55") {
            // CLK_EnableModuleClock is unable to configure modules on the AHBCLK.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "Mini55Series.h"';

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "NUC029AE") {
            // CLK_EnableModuleClock does not exist.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "NUC029FAE.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "NUC100CN") {
            // BSPv3 does not exist.
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "NUC100Series.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "NM1200") {
            // BSP is not stable.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "Mini51.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "NM1500") {
            // BSP is not stable.
            beginningClockRegs = [sPWRCON, sPLLCON];
            sIncludeHeaderFile = '#include "MT500Series.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "NM1500") {
            // BSP is not stable.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "M2003C.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else if (g_chipType === "APM32E103xCxE") {
            // BSP is not stable.
            beginningClockRegs = [sPWRCON];
            sIncludeHeaderFile = '#include "APM32E103xCxE.h"';
            enableFieldDefines = [];
            statusFieldDefines = [];

            g_bHasBSPtoSupport = false;
        }
        else { //NUC400
            beginningClockRegs = [sPWRCON, sPLLCON, 'PLL2CTL'];
            sIncludeHeaderFile = '#include "NUC472_442.h"';
            enableFieldDefines = ['CLK_PWRCTL_LIRCEN_Msk', 'CLK_PWRCTL_HIRCEN_Msk', 'CLK_PWRCTL_LXTEN_Msk', 'CLK_PWRCTL_HXTEN_Msk', 'none', 'none'];
            statusFieldDefines = ['CLK_STATUS_LIRCSTB_Msk', 'CLK_STATUS_HIRCSTB_Msk', 'CLK_STATUS_LXTSTB_Msk', 'CLK_STATUS_HXTSTB_Msk', 'CLK_STATUS_PLLSTB_Msk', 'none', 'none'];
        }
        if (typeof NUTOOL_PER !== 'undefined') {
            sIncludeHeaderFile = '#include "NuCodeGenProj.h"';
            if (command === 'modularizeCode') {
                sIncludeHeaderFile += '\n#include "clk_conf.h"';
            }
        }

        g_clockRegsString = '';
        if (g_svgGroup !== null) {
            g_clockRegsString = "Base Clocks:\n";
            // base clocks
            if (isFieldBe1(sOSC10K_EN) && g_realLIRCoutputClock > 0) {
                tableData = {};
                tableData.module = sLIRC;
                tableData.busClock = g_realLIRCoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sLIRC + ':' + g_realLIRCoutputClock.toHzString() + '\n';
            }
            if ((isFieldBe1(sOSC22M_EN) || isFieldBe1('HIRC1EN')) && g_realHIRCoutputClock > 0) {
                tableData = {};
                tableData.module = sHIRC;
                tableData.busClock = g_realHIRCoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sHIRC + ':' + g_realHIRCoutputClock.toHzString() + '\n';
            }
            if ((isFieldBe1(sOSC22M2_EN) || isFieldBe1('HIRC2EN')) && g_realHIRC2outputClock > 0) {
                tableData = {};
                tableData.module = sHIRC2;
                tableData.busClock = g_realHIRC2outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sHIRC2 + ':' + g_realHIRC2outputClock.toHzString() + '\n';
            }
            if (isFieldBe1('HIRC48EN') && g_realHIRC48outputClock > 0) {
                tableData = {};
                tableData.module = 'HIRC48';
                tableData.busClock = g_realHIRC48outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'HIRC48:' + g_realHIRC48outputClock.toHzString() + '\n';
            }
            if (isFieldBe1('MIRCEN') && g_realMIRCoutputClock > 0) {
                tableData = {};
                tableData.module = 'MIRC';
                tableData.busClock = g_realMIRCoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'MIRC:' + g_realMIRCoutputClock.toHzString() + '\n';
            }
            if (isFieldBe1('MIRC1P2MEN') && g_realMIRC1P2MoutputClock > 0) {
                tableData = {};
                tableData.module = 'MIRC1P2M';
                tableData.busClock = g_realMIRC1P2MoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'MIRC1P2M:' + g_realMIRC1P2MoutputClock.toHzString() + '\n';
            }
            if ((isFieldBe1(sXTL32K_EN) || isFieldBe1('LIRC32KEN')) && g_realLXToutputClock > 0) {
                tableData = {};
                tableData.module = sLXT;
                tableData.busClock = g_realLXToutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'LXT:' + g_realLXToutputClock.toHzString() + '\n';
            }
            if (isFieldBe1(sXTL12M_EN) && g_realHXToutputClock > 0) {
                tableData = {};
                tableData.module = sHXT;
                tableData.busClock = g_realHXToutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sHXT + ':' + g_realHXToutputClock.toHzString() + '\n';
            }
            if (isFieldBe1(sXTL12M_EN) && g_realRTC32koutputClock > 0) {
                tableData = {};
                tableData.module = 'RTC32k';
                tableData.busClock = g_realRTC32koutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'RTC32k:' + g_realRTC32koutputClock.toHzString() + '\n';
            }
            if ((!isFieldBe1('PD') || isFieldBe1('PLLEN')) && g_realPLLoutputClock > 0) {
                tableData = {};
                tableData.module = sPLL;
                tableData.busClock = g_realPLLoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sPLL + ':' + g_realPLLoutputClock.toHzString() + '\n';
            }
            if (isFieldBe1('PLL2CKEN') && g_realPLL2outputClock > 0) {
                tableData = {};
                tableData.module = 'PLL2';
                tableData.busClock = g_realPLL2outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PLL2:' + g_realPLL2outputClock.toHzString() + '\n';
            }
            if (isFieldBe1('PLL2CKEN') && g_realPLL480MoutputClock > 0) {
                tableData = {};
                tableData.module = 'PLL480M';
                tableData.busClock = g_realPLL480MoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PLL480M:' + g_realPLL480MoutputClock.toHzString() + '\n';
            }
            if (!isFieldBe1('APD') && g_realAPLLoutputClock > 0) {
                tableData = {};
                tableData.module = 'APLL';
                tableData.busClock = g_realAPLLoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'APLL:' + g_realAPLLoutputClock.toHzString() + '\n';
            }
            if (!isFieldBe1('PDFN') && g_realPLLFNoutputClock > 0) {
                tableData = {};
                tableData.module = 'PLLFN';
                tableData.busClock = g_realPLLFNoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PLLFN:' + g_realPLLFNoutputClock.toHzString() + '\n';
            }
            if (isFieldBe1(sXTL12M_EN) && g_realHSUSBOTGPHYoutputClock > 0) {
                tableData = {};
                tableData.module = 'HSUSB_OTG_PHY';
                tableData.busClock = g_realHSUSBOTGPHYoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'HSUSB_OTG_PHY:' + g_realHSUSBOTGPHYoutputClock.toHzString() + '\n';
            }
            if (g_realHCLKoutputClock > 0) {
                tableData = {};
                tableData.module = sHCLK;
                tableData.busClock = g_realHCLKoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sHCLK + ':' + g_realHCLKoutputClock.toHzString() + '\n';
            }
            if (g_realPCLKoutputClock > 0 /*&& NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty('PCLKSEL')*/) {
                tableData = {};
                tableData.module = sPCLK;
                tableData.busClock = g_realPCLKoutputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += sPCLK + ':' + g_realPCLKoutputClock.toHzString() + '\n';
            }
            if (g_realPCLK0outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK0SEL)) {
                tableData = {};
                tableData.module = 'PCLK0';
                tableData.busClock = g_realPCLK0outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PCLK0:' + g_realPCLK0outputClock.toHzString() + '\n';
            }
            if (g_realPCLK1outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK1SEL)) {
                tableData = {};
                tableData.module = 'PCLK1';
                tableData.busClock = g_realPCLK1outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PCLK1:' + g_realPCLK1outputClock.toHzString() + '\n';
            }
            if (g_realPCLK2outputClock > 0 && NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(sPCLK2SEL)) {
                tableData = {};
                tableData.module = 'PCLK2';
                tableData.busClock = g_realPCLK2outputClock.toHzString();
                tableData.engineClock = '';
                tableDataArray.push(tableData);
                g_clockRegsString += 'PCLK2:' + g_realPCLK2outputClock.toHzString() + '\n';
            }
            // Enabled-Module Frequencies
            g_clockRegsString += sEnableModule;
            moduleNames.sort();
            for (i = 0, max = moduleNames.length; i < max; i += 1) {
                currentNode = moduleNames[i];
                enableField = NUTOOL_CLOCK.g_Module[currentNode][1];
                enableFieldArray = [];
                whileCount = 0;
                if (enableField.indexOf('/') === -1) {
                    enableFieldArray.push(enableField);
                }
                else {
                    while (enableField.indexOf('/') !== -1) {
                        enableFieldArray.push(enableField.slicePriorToX('/'));
                        enableField = enableField.sliceAfterX('/');

                        whileCount = whileCount + 1;
                        if (whileCount > 10) {
                            break;
                        }
                    }

                    enableFieldArray.push(enableField);
                }
                bChecked = true;
                for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                    if (!isEnabled(enableFieldArray[j])) {
                        bChecked = false;
                        break;
                    }
                }

                if (bChecked) {
                    // Bus clock and Engine clock
                    if (hasBusClockOrNot(currentNode)) {
                        tableData = {};
                        tableData.module = currentNode;
                        tempValue = findBusClock(currentNode);
                        tableData.busClock = tempValue.sliceAfterX(':') + ' ' + tempValue.slicePriorToX(':');
                        g_clockRegsString += currentNode + '=Bus Clock' + tempValue;
                        if (hasEngineClockOrNot(currentNode)) {
                            tableData.engineClock = $("#" + currentNode + "_span_showRealFreq").text().trim();
                            g_clockRegsString = g_clockRegsString + "/Engine Clock:" + $("#" + currentNode + "_span_showRealFreq").text().trim();
                        }
                        else {
                            tableData.engineClock = '';
                        }
                        tableDataArray.push(tableData);
                        g_clockRegsString += '\n';
                    }
                }
            }
            // for all modules are disabled
            if ((g_clockRegsString.lastIndexOf(sEnableModule) + sEnableModule.length) === g_clockRegsString.length) {
                g_clockRegsString = g_clockRegsString.slicePriorToX(sEnableModule);
            }
        }
        g_clockRegsString += "********************/\n\n";

        // include file part
        g_clockRegsString += sIncludeHeaderFile;
        g_clockRegsString += '\n\n';
        if (g_bHasBSPtoSupport) {
            if (g_realHXToutputClock !== 0) {
                if (typeof NUTOOL_PER === 'undefined') {
                    if (command === 'modularizeCode') {
                        g_clockRegsString1 = "#undef  __" + sHXT + "\n";
                        g_clockRegsString1 += "#define __" + sHXT + "         (" + g_realHXToutputClock + "UL)  /*!< High Speed External Crystal Clock Frequency */\n\n";
                    }
                    else {
                        // reference-clock defines
                        g_clockRegsString += "/*----------------------------------------------------------------------------\n";
                        g_clockRegsString += "  Define " + sHXT + " clock.\n";
                        g_clockRegsString += "  Please locate and modify the real one in your project.\n";
                        g_clockRegsString += "  Otherwise, the project may fail to build.\n";
                        g_clockRegsString += " *----------------------------------------------------------------------------*/\n";
                        g_clockRegsString += "#define __" + sHXT + "         (" + g_realHXToutputClock + "UL)  /*!< High Speed External Crystal Clock Frequency */\n\n";
                    }
                }
                else {
                    g_clockRegsString1 = "__" + sHXT + "=" + g_realHXToutputClock + "ul;__LXT=" + g_realLXToutputClock + "ul";
                }
            }
            else {
                g_clockRegsString1 = "";
            }
            // NuMicroClock_Config part
            if (command === 'default') {
                g_clockRegsString += '/*\n * @brief This function updates clock registers to fulfill the configuration\n * @param None\n * @return None\n */\n';
                if (typeof NUTOOL_PER === 'undefined') {
                    g_clockRegsString += 'void SYS_Init(void)\n{\n';
                }
                else {
                    g_clockRegsString += 'void Clock_Init(void)\n{\n';
                }
            }
            else if (command.indexOf('Embeetle') === 0) {
                g_clockRegsString += '/*\n * @brief This function updates clock registers to fulfill the configuration\n * @param None\n * @return None\n */\n';
                g_clockRegsString += 'void Clock_Init(void)\n{\n';
            }
            else if (command === 'modularizeCode') {
                theCode3 = g_concatenate_generated_code_internal('modularizeCode');

                g_clockRegsString += "void NuCodeGenProj_init_base(void)\n{\n";
                g_clockRegsString2 += "void NuCodeGenProj_init_base(void);\n";
                g_clockRegsString += generateMainCode();
                g_clockRegsString += "    return;\n}\n\n";

                if (typeof NUTOOL_PER === 'undefined') {
                    g_clockRegsString += "void NuCodeGenProj_init(void)\n{\n";
                    g_clockRegsString2 += "void NuCodeGenProj_init(void);\n";
                }
                else {
                    g_clockRegsString += "void Clock_Init(void)\n{\n";
                    g_clockRegsString2 += "void Clock_Init(void);\n";
                }
            }
            g_clockRegsString += '    /*---------------------------------------------------------------------------------------------------------*/\n';
            g_clockRegsString += '    /* Init System Clock                                                                                       */\n';
            g_clockRegsString += '    /*---------------------------------------------------------------------------------------------------------*/\n';
            // the part of register values
            local_maxClockRegsStringLength = 0;
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                currentNode = generateCodeRegNameAndMask(g_clockRegisterNames[i]).slicePriorToX('/');
                if (currentNode.length > local_maxClockRegsStringLength) {
                    local_maxClockRegsStringLength = currentNode.length;
                }
            }
            for (i = 0, max = beginningClockRegs.length; i < max; i += 1) {
                if (typeof NUTOOL_CLOCK.g_register_map[beginningClockRegs[i]] !== 'undefined') {
                    currentNode = generateCodeRegNameAndMask(beginningClockRegs[i]);
                    mask = currentNode.sliceAfterX('/');
                    currentNode = currentNode.slicePriorToX('/');
                    if ((local_maxClockRegsStringLength) > currentNode.length) {
                        for (j = 0, maxJ = local_maxClockRegsStringLength - currentNode.length; j < maxJ; j += 1) {
                            currentNode += ' ';
                        }
                    }
                    g_clockRegsString += '    //' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[beginningClockRegs[i]]).toUpperCase() + 'UL;\n';
                }
            }
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                if ($.inArray(g_clockRegisterNames[i], beginningClockRegs) === -1 &&
                    NUTOOL_CLOCK.g_register_map_description[g_clockRegisterNames[i]].indexOf('Read Only') === -1) {
                    currentNode = generateCodeRegNameAndMask(g_clockRegisterNames[i]);
                    mask = currentNode.sliceAfterX('/');
                    currentNode = currentNode.slicePriorToX('/');
                    if ((local_maxClockRegsStringLength) > currentNode.length) {
                        for (j = 0, maxJ = local_maxClockRegsStringLength - currentNode.length; j < maxJ; j += 1) {
                            currentNode += ' ';
                        }
                    }
                    g_clockRegsString += '    //' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[g_clockRegisterNames[i]]).toUpperCase() + 'UL;\n';
                }
            }
            // the main part
            g_clockRegsString += '\n';
            if (typeof NUTOOL_PER === 'undefined' && g_chipType !== 'NUC505') {
                g_clockRegsString += '    /* Unlock protected registers */\n    SYS_UnlockReg();\n\n';
            }
            if (command === 'default') {
                g_clockRegsString += generateMainCode();
            }
            else if (command === 'modularizeCode') {
                g_clockRegsString += "    /* Enable base clock */\n";
                g_clockRegsString += "    NuCodeGenProj_init_base();\n\n";
                g_clockRegsString += theCode3;
            }
        }
        else { // for those which have no BSP to support
            g_clockRegsString += '/*\n * @brief This function updates clock registers to fulfill the configuration\n * @param None\n * @return None\n */\n';
            if (typeof NUTOOL_PER === 'undefined' && command.indexOf('Embeetle') == -1) {
                g_clockRegsString += 'void SYS_Init(void)\n{\n';
            }
            else {
                g_clockRegsString += 'void Clock_Init(void)\n{\n';
            }
            currentNode = generateCodeRegNameAndMask(sPWRCON);
            mask = currentNode.sliceAfterX('/');
            currentNode = currentNode.slicePriorToX('/');
            g_clockRegsString += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[sPWRCON]).toUpperCase() + 'UL;\n';
            if (typeof NUTOOL_CLOCK.g_register_map[sPLLCON] !== 'undefined') {
                currentNode = generateCodeRegNameAndMask(sPLLCON);
                mask = currentNode.sliceAfterX('/');
                currentNode = currentNode.slicePriorToX('/');
                g_clockRegsString += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[sPLLCON]).toUpperCase() + 'UL;\n';
            }
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                if ($.inArray(g_clockRegisterNames[i], beginningClockRegs) === -1) {
                    currentNode = generateCodeRegNameAndMask(g_clockRegisterNames[i]);
                    mask = currentNode.sliceAfterX('/');
                    currentNode = currentNode.slicePriorToX('/');
                    g_clockRegsString += '    ' + currentNode + ' = (' + currentNode + ' & ~(' + mask + ')) | 0x' + decimalToHex(g_clockRegs[g_clockRegisterNames[i]]).toUpperCase() + 'UL;\n';
                }
            }
            g_clockRegsString += '\n    return;\n}\n';
        }

        return tableDataArray;
    }

    function concatenate_generated_code_internal(command) {
        var i,
            j,
            max,
            maxJ,
            currentNode,
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module),
            sCLKO = 'CLKO'.toEquivalent().toString(),
            sCLKO_Divider = 'CLKO_Divider'.toEquivalent().toString(),
            sCLKO1 = 'CLKO1'.toEquivalent().toString(),
            sCLKO1_Divider = 'CLKO1_Divider'.toEquivalent().toString(),
            sSTCLK_S = 'STCLK_S'.toEquivalent().toString(),
            s_S = '_S'.toEquivalent().toString(),
            local_clockRegsString = "    /* Enable module clock and set clock source */\n",
            sEnableIP_inner = "    /* Enable IP clock */\n",
            theCode = "",
            theString,
            theString1,
            theString2,
            enableField,
            enableFieldArray = [],
            whileCount,
            bChecked;

        if (!g_bHasBSPtoSupport) {
            return;
        }

        if (typeof command === 'undefined') {
            command = "default";
        }

        // based on the clock registers, generate the code representing what has been enabled.
        if (command === 'default') {
            g_clockRegsString += sEnableIP_inner;
        }
        else if (command === 'modularizeCode') {
            g_clockRegsString2 = "";
            moduleNames = moduleNames.sort(natualSort);
        }

        theCode = "";
        for (i = 0, max = moduleNames.length; i < max; i += 1) {
            currentNode = moduleNames[i];
            enableField = NUTOOL_CLOCK.g_Module[currentNode][1];
            enableFieldArray = [];
            whileCount = 0;
            if (enableField.indexOf('/') === -1) {
                enableFieldArray.push(enableField);
            }
            else {
                while (enableField.indexOf('/') !== -1) {
                    enableFieldArray.push(enableField.slicePriorToX('/'));
                    enableField = enableField.sliceAfterX('/');

                    whileCount = whileCount + 1;
                    if (whileCount > 10) {
                        break;
                    }
                }

                enableFieldArray.push(enableField);
            }
            bChecked = true;
            for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                if (!isEnabled(enableFieldArray[j])) {
                    bChecked = false;
                    break;
                }
            }

            if (bChecked) {
                // Enable part
                theString = "";
                theString1 = "";
                theString2 = "";
                if (currentNode === sCLKO) {
                    theString1 = getFieldDefine(currentNode);
                    if (g_chipType === 'NANO100AN' || g_chipType === 'NANO100BN') {
                        theString = '    CLK_EnableCKO(' + theString1 + ');\n';
                        theString2 = '    CLK_DisableCKO();\n';
                    }
                    else if (g_chipType === 'NANO112') {
                        theString = '    CLK_EnableCKO0(' + theString1 + ', 1);\n';
                        theString2 = '    CLK_DisableCKO0();\n';
                    }
                    else {
                        theString = '    CLK_EnableCKO(' + theString1 + ', 1);\n';
                        theString2 = '    CLK_DisableCKO();\n';
                    }

                    if ($.inArray('CLKO_1Hz', moduleNames) !== -1) {
                        theString += getFieldDefine1(NUTOOL_CLOCK.g_Module.CLKO_1Hz[1], false);
                    }
                }
                else if (currentNode === sCLKO_Divider) {
                    theString1 = getFieldDefine(currentNode);
                    if (g_chipType === 'NANO100AN' || g_chipType === 'NANO100BN') {
                        theString = '    CLK_EnableCKO(' + theString1 + ');\n';
                        theString2 = '    CLK_DisableCKO();\n';
                    }
                    else if (g_chipType === 'NANO112') {
                        theString = '    CLK_EnableCKO0(' + theString1 + ', 0);\n';
                        theString2 = '    CLK_DisableCKO0();\n';
                    }
                    else {
                        theString = '    CLK_EnableCKO(' + theString1 + ', 0);\n';
                        theString2 = '    CLK_DisableCKO();\n';
                    }

                    if ($.inArray('CLKO_1Hz', moduleNames) !== -1) {
                        theString += getFieldDefine1(NUTOOL_CLOCK.g_Module.CLKO_1Hz[1], false);
                    }
                }
                else if (currentNode === sCLKO1) {
                    theString1 = getFieldDefine(currentNode);
                    theString = '    CLK_EnableCKO1(' + theString1 + ', 1);\n';
                    theString2 = '    CLK_DisableCKO1();\n';
                }
                else if (currentNode === sCLKO1_Divider) {
                    theString1 = getFieldDefine(currentNode);
                    theString = '    CLK_EnableCKO1(' + theString1 + ', 0);\n';
                    theString2 = '    CLK_DisableCKO1();\n';
                }
                else if (currentNode === 'CLKO_1Hz') {
                    theString = getFieldDefine1(NUTOOL_CLOCK.g_Module.CLKO_1Hz[1], true);
                    theString2 = getFieldDefine1(NUTOOL_CLOCK.g_Module.CLKO_1Hz[1], false);
                }
                else if (currentNode === 'SYSTICK') {
                    theString = "";
                    if (!isFieldBe1('CLKSRC') && readValueFromClockRegs('STICKDIV') !== -1) {
                        theString = '    CLK->CLKDIV1 = CLK->CLKDIV1 & ~CLK_CLKDIV1_STICKDIV_Msk;\n';
                        theString += '    CLK->CLKDIV1 = CLK->CLKDIV1 + CLK_CLKDIV1_STICK(' + (readValueFromClockRegs('STICKDIV') + 1) + ');\n';
                    }
                    theString1 = getFieldDefine('SYSTICK', sSTCLK_S, '');
                    theString += '    CLK_EnableSysTick(' + theString1 + ', 0);\n';
                    theString2 = '    CLK_DisableSysTick();\n';
                }

                if (theString !== "") {
                    if (command === 'modularizeCode') {
                        g_clockRegsString += "void NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void)\n{\n";
                        g_clockRegsString2 += "void NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void);\n";
                        local_clockRegsString += "    NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "();\n";
                    }
                    g_clockRegsString += theString;
                    g_generateCodeContent += theString;
                }
                else {
                    if (command !== 'partial' &&
                        currentNode !== 'HSUSBH' &&
                        (currentNode !== 'WWDT' ||
                            (currentNode === 'WWDT' && NUTOOL_CLOCK.g_Module.WWDT[0].indexOf(s_S) !== -1))) {
                        if (typeof NUTOOL_CLOCK.g_Module[currentNode][3] !== 'undefined') {
                            theString = '    CLK_EnableModuleClock(' + NUTOOL_CLOCK.g_Module[currentNode][3] + ');\n';
                            theString2 = '    CLK_DisableModuleClock(' + NUTOOL_CLOCK.g_Module[currentNode][3] + ');\n';
                        }
                        else {
                            theString = '    CLK_EnableModuleClock(' + currentNode + '_MODULE);\n';
                            theString2 = '    CLK_DisableModuleClock(' + currentNode + '_MODULE);\n';
                        }

                        if (command === 'modularizeCode') {
                            g_clockRegsString += "void NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void)\n{\n";
                            g_clockRegsString2 += "void NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void);\n";
                            local_clockRegsString += "    NuCodeGenProj_init_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "();\n";
                        }
                        g_clockRegsString += theString;
                        g_generateCodeContent += theString;
                    }

                    theString1 = getFieldDefine(currentNode);
                    if (theString1.indexOf('RTC->LXTCTL') !== -1) {
                        if (command === 'modularizeCode') {
                            g_clockRegsString += theString1;
                        }
                        else {
                            theCode += theString1;
                        }
                        g_generateCodeContent += theString1;
                    }
                    else if (theString1 !== 'None' && theString1 !== 'MODULE_NoMsk, MODULE_NoMsk') {
                        theString = '    CLK_SetModuleClock(' + currentNode + '_MODULE, ' + theString1 + ');\n';
                        if (command === 'modularizeCode') {
                            g_clockRegsString += theString;
                        }
                        else {
                            theCode += theString;
                        }
                        g_generateCodeContent += theString;
                    }
                }

                if (command === 'modularizeCode') {
                    if (theString !== "") {
                        g_clockRegsString += "\n    return;\n}\n\n";
                    }
                    if (theString2 !== '') {
                        g_clockRegsString += "void NuCodeGenProj_deinit_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void)\n{\n";
                        g_clockRegsString2 += "void NuCodeGenProj_deinit_" + currentNode.slicePriorToX('_1Hz').slicePriorToX('_Divider').toLowerCase() + "(void);\n";
                        g_clockRegsString += theString2;
                        g_clockRegsString += "\n    return;\n}\n\n";
                    }
                }
                if (command === 'functionalTest') {
                    g_clockRegsString += theString2;
                }
            }
        }

        if (theCode !== "") {
            if (command === 'default') {
                g_clockRegsString += '\n    /* Set IP clock */\n';
            }

            g_clockRegsString += theCode;
        }

        return local_clockRegsString;
    }

    function concatenate_generated_code_end() {
        var sEnableIP_inner = "    /* Enable IP clock */\n",
            sEnableIP_inner1 = "    /* Enable module clock and set clock source */\n";

        if (!g_bHasBSPtoSupport) {
            return g_clockRegsString;
        }

        if (typeof command === 'undefined') {
            command = "default";
        }

        // for all modules are disabled
        if ((g_clockRegsString.lastIndexOf(sEnableIP_inner) + sEnableIP_inner.length) === g_clockRegsString.length) {
            g_clockRegsString = g_clockRegsString.slicePriorToX(sEnableIP_inner);
        }
        else if ((g_clockRegsString.lastIndexOf(sEnableIP_inner1) + sEnableIP_inner1.length) === g_clockRegsString.length) {
            g_clockRegsString = g_clockRegsString.slicePriorToX(sEnableIP_inner1);
        }
        else {
            g_clockRegsString += '\n';
        }

        g_clockRegsString += '    /* Update System Core Clock */\n    /* User can use SystemCoreClockUpdate() to calculate SystemCoreClock. */\n    SystemCoreClockUpdate();\n\n';
        if (typeof NUTOOL_PER === 'undefined' && g_chipType !== 'NUC505') {
            g_clockRegsString += '    /* Lock protected registers */\n    SYS_LockReg();\n\n';
        }
        g_clockRegsString += '    return;\n}\n\n';

        return g_clockRegsString;
    }

    function concatenate_generated_code_HCLK() {
        var i,
            j,
            max,
            maxJ,
            sHCLK = 'HCLK'.toEquivalent().toString(),
            sHCLK_S = 'HCLK_S'.toEquivalent().toString(),
            sHCLK_N = 'HCLK_N'.toEquivalent().toString(),
            sHXTWAIT = 'HXTWAIT'.toEquivalent().toString(),
            sXTL12M_EN = 'XTL12M_EN'.toEquivalent().toString(),
            selectField,
            fullFieldName,
            selectFieldName,
            selectFieldValue;

        g_bIsTriggerMultiConfiguring = true;

        g_clockRegsString += '\n    /* Check more. Set ' + sHCLK + ' clock */\n';
        selectField = sHCLK_S;
        for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[selectField].length; i < max; i += 1) {
            g_clickIndexByTest = i;
            $('#HCLK_canvas').click();

            g_clockRegsString += '    CLK_SetHCLK(' + getFieldDefine(sHCLK, sHCLK_S, sHCLK_N) + ');\n';
        }

        g_bIsTriggerMultiConfiguring = false;
    }

    function generateCodeRegNameAndMask(regName) {
        var i,
            max,
            j,
            maxJ,
            maskValue = 0,
            maskValueRecord = [],
            sSYST_CSR = 'SYST_CSR'.toEquivalent().toString(),
            tempString,
            returnString = "";

        if (typeof NUTOOL_CLOCK.g_register_map[regName] !== 'undefined') {
            for (i = 0, max = NUTOOL_CLOCK.g_register_map[regName].length; i < max; i += 1) {
                tempString = NUTOOL_CLOCK.g_register_map[regName][i].sliceAfterX(':');

                if (maskValueRecord.indexOf(tempString) === -1) {
                    maskValueRecord.push(tempString);
                    if (tempString.indexOf('-') === -1) {
                        maskValue = maskValue + Math.pow(2, tempString);
                    }
                    else {
                        for (j = parseInt(tempString.sliceAfterX('-'), 10), maxJ = parseInt(tempString.slicePriorToX('-'), 10) + 1; j < maxJ; j += 1) {
                            maskValue = maskValue + Math.pow(2, j);
                        }
                    }
                }
            }

            if (regName === sSYST_CSR) {
                returnString = "SysTick->CTRL/" + "0x" + decimalToHex(maskValue).toUpperCase() + "UL";
            }
            else if (regName === 'RTC_LXTCTL') {
                returnString = "RTC->LXTCTL/" + "0x" + decimalToHex(maskValue).toUpperCase() + "UL";
            }
            else if (regName === 'RTC_CLKSRC') {
                returnString = "RTC->CLKSRC/" + "0x" + decimalToHex(maskValue).toUpperCase() + "UL";
            }
            else {
                returnString = "CLK->" + regName + "/" + "0x" + decimalToHex(maskValue).toUpperCase() + "UL";
            }
        }

        return returnString;
    }

    function getFieldDefine(currentNode, selectorName, dividerName) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fieldName,
            fullFieldName,
            fullFieldName1,
            bitPosition,
            bitCount,
            mask,
            returnValue = -1, // it means nothing happens.
            returnString = "",
            sCLKO = 'CLKO'.toEquivalent().toString(),
            sCLKO_Divider = 'CLKO_Divider'.toEquivalent().toString(),
            sCLKO1 = 'CLKO1'.toEquivalent().toString(),
            sCLKO1_Divider = 'CLKO1_Divider'.toEquivalent().toString(),
            sLXT = 'LXT'.toEquivalent().toString(),
            sHXT = 'HXT'.toEquivalent().toString(),
            sLIRC = 'LIRC'.toEquivalent().toString(),
            sHCLK = 'HCLK'.toEquivalent().toString(),
            selectFieldNameExtended,
            selectFieldNameExtendedShiftBit,
            //oldSelectorOrDividerValue,
            newSelectorOrDividerValue,
            bHasExtended = false,
            bFound = false;

        // Selector part
        if (typeof selectorName === 'undefined') {
            fieldName = NUTOOL_CLOCK.g_Module[currentNode][0];
        }
        else {
            fieldName = selectorName;
        }

        returnValue = -1;
        if (NUTOOL_CLOCK.g_CLKSEL.hasOwnProperty(fieldName)) {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                        if (!NUTOOL_CLOCK.g_CLKSEL_EXTENDED.hasOwnProperty(fieldName)) {
                            returnValue = readValueFromClockRegs(fieldName);
                            bHasExtended = false;
                        }
                        else {
                            selectFieldNameExtended = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[fieldName][0];
                            selectFieldNameExtendedShiftBit = parseInt(selectFieldNameExtended.sliceAfterX(':'), 10);
                            selectFieldNameExtended = selectFieldNameExtended.slicePriorToX(':');
                            returnValue = readValueFromClockRegs(fieldName) + (readValueFromClockRegs(selectFieldNameExtended) << selectFieldNameExtendedShiftBit) >>> 0;
                            bHasExtended = true;
                        }
                        break;
                    }
                }
                if (returnValue !== -1) {
                    break;
                }
            }
        }

        if (returnValue !== -1) {
            if (!(currentNode === 'SYSTICK' && isFieldBe1('CLKSRC'))) {
                for (i = 0, max = NUTOOL_CLOCK.g_CLKSEL[fieldName].length; i < max; i += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_CLKSEL[fieldName][i];
                    newSelectorOrDividerValue = parseInt(fullFieldName.sliceAfterX(':'), 10);
                    if (returnValue === newSelectorOrDividerValue) {
                        break;
                    }
                    else if (i === max - 1) {
                        returnString = "MODULE_NoMsk";
                    }
                }
            }
            else {
                fullFieldName = sHCLK;
            }

            fullFieldName = fullFieldName.slicePriorToX(':');
            // do some replacements for special cases.
            if (g_bHXTorLXT && fullFieldName.indexOf('XT') !== -1) {
                if (g_chipType === 'MINI57') {
                    fullFieldName = fullFieldName.replace(sHXT, 'EXT').replace(sLXT, 'EXT');
                }
                else {
                    fullFieldName = fullFieldName.replace(sHXT, 'XTAL').replace(sLXT, 'XTAL');
                }
            }
            if (g_chipType === 'MINI57') {
                if (fieldName.indexOf('STCLK') !== -1) {
                    if (fullFieldName.indexOf('/') === -1) {
                        returnString = "CLK_SYSTICK_SRC_" + fullFieldName;
                    }
                    else {
                        returnString = "CLK_SYSTICK_SRC_" + fullFieldName.slicePriorToX('/') + "_HALF";
                    }
                }
                else {
                    if (fullFieldName.indexOf('/') === -1) {
                        returnString = "CLK_" + fieldName.slicePriorToX('SEL') + "_SRC_" + fullFieldName;
                    }
                    else {
                        fullFieldName1 = fullFieldName;
                        returnString = "CLK_" + fieldName.slicePriorToX('SEL') + "_SRC_" + fullFieldName.slicePriorToX('/') + "_" + fullFieldName1.sliceAfterX('/');
                    }
                }
            }
            else if (g_chipType === 'NUC505') {
                returnString = "CLK_" + fieldName.slicePriorToX('SEL').slicePriorToX('_S') + "_SRC_" + fullFieldName.replace(sHXT, 'EXT').replace('RTC32k', 'RTC');
            }
            else {
                if (fullFieldName.indexOf('/') === -1) {
                    returnString = "CLK_" + clockRegName + "_" + fieldName + "_" + fullFieldName;
                }
                else if (fullFieldName.indexOf('/') !== -1 && fullFieldName.indexOf('DIV') !== -1) {
                    if (typeof dividerName === 'undefined') {
                        dividerName = fullFieldName.sliceAfterX('(').slicePriorToX('+');
                    }
                    fullFieldName1 = fullFieldName;
                    returnString = "CLK_" + clockRegName + "_" + fieldName + "_" + fullFieldName.slicePriorToX('/');
                }
                else {
                    fullFieldName1 = fullFieldName;
                    returnString = "CLK_" + clockRegName + "_" + fieldName + "_" + fullFieldName.slicePriorToX('/') + "_DIV" + fullFieldName1.sliceAfterX('/');
                }
            }
            // post-processing of returnString
            if ((g_chipType.indexOf("M25") === 0 || g_chipType.indexOf('M030') === 0 || g_chipType.indexOf('M031') === 0) &&
                returnString.indexOf('LXTCTL') !== -1) {
                if (returnString.indexOf(sLIRC) !== -1) {
                    returnString = "    RTC->LXTCTL |= RTC_LXTCTL_C32KS_Msk;\n";
                }
                else { // LXT
                    returnString = "    RTC->LXTCTL = RTC->LXTCTL & ~RTC_LXTCTL_C32KS_Msk;\n";
                }
                return returnString;
            }
            if (g_chipType === 'M2354' && returnString.indexOf('LXTCTL') !== -1) {
                if (returnString.indexOf(sLIRC) !== -1) {
                    returnString = "    RTC->LXTCTL |= RTC_LXTCTL_RTCCKSEL_Msk;\n";
                }
                else { // LXT
                    returnString = "    RTC->LXTCTL = RTC->LXTCTL & ~RTC_LXTCTL_RTCCKSEL_Msk;\n";
                }
                return returnString;
            }
            if ((g_chipType === 'NUC2201' || g_chipType === 'NUC029xEE') && returnString.indexOf('HIRC48') !== -1) {
                returnString = "CLK_CLKSEL0_USB_S_RC48M";
            }
            if (g_chipType === 'M480LD' && returnString.indexOf('HIRC48') !== -1) {
                returnString = "CLK_CLKSEL0_USBSEL_RC48M";
            }
            if (bHasExtended) {
                fieldName = NUTOOL_CLOCK.g_CLKSEL_EXTENDED[fieldName][0].slicePriorToX(':');
                for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                    clockRegName = g_clockRegisterNames[i];
                    for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                        fullFieldName1 = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                        if (fullFieldName1.indexOf(fieldName) !== -1 && fullFieldName1.indexOf(':') === fieldName.length) {
                            bFound = true;
                            break;
                        }
                    }
                    if (bFound) {
                        break;
                    }
                }

                returnString = returnString + "|CLK_" + clockRegName + "_" + fieldName.slicePriorToX('_') + "_EXT_" + fullFieldName;
            }
        }
        else if (currentNode === 'SYSTICK') {
            if (isFieldBe1('CLKSRC')) {
                fullFieldName = sHCLK;
            }
            else {
                if (NUTOOL_CLOCK.g_Module.SYSTICK[0].indexOf('STICKDIV') === -1) {
                    fullFieldName = NUTOOL_CLOCK.g_Module.SYSTICK[0];
                }
                else {
                    fullFieldName = sHXT;
                }
            }
            fullFieldName = fullFieldName.slicePriorToX(':');
            // do some replacements for special cases.
            if (g_bHXTorLXT && fullFieldName.indexOf('XT') !== -1) {
                fullFieldName = fullFieldName.replace(sHXT, 'XTAL').replace(sLXT, 'XTAL');
            }
            if (g_chipType !== 'NUC505') { // NANO103 and NANO112
                if (fullFieldName.indexOf('/') === -1) {
                    returnString = "CLK_CLKSEL0_STCLKSEL_" + fullFieldName;
                }
                else { // NUC505
                    fullFieldName1 = fullFieldName;
                    returnString = "CLK_CLKSEL0_STCLKSEL_" + fullFieldName.slicePriorToX('/') + "_DIV" + fullFieldName1.sliceAfterX('/');
                }
            }
            else {
                returnString = "CLK_STICK_SRC_" + fullFieldName.replace(sHXT, 'EXT').replace('RTC32k', 'RTC');
            }
        }
        else {
            returnString = "MODULE_NoMsk";
        }

        // Divider part
        if (currentNode !== 'SYSTICK') {
            if (typeof dividerName === 'undefined') {
                fieldName = NUTOOL_CLOCK.g_Module[currentNode][2];
            }
            else {
                fieldName = dividerName;
            }

            if (fieldName === 'none') {
                returnString = returnString + ", MODULE_NoMsk";
            }
            else {
                returnValue = -1;
                for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                    clockRegName = g_clockRegisterNames[i];
                    for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                        fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                        if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                            if (fullFieldName.indexOf('-') === -1) {
                                bitPosition = parseInt(fullFieldName.sliceAfterX(':'), 10);
                                mask = (1 << bitPosition) >>> 0;
                            }
                            else {
                                bitPosition = parseInt(fullFieldName.sliceAfterX('-'), 10);
                                bitCount = parseInt(fullFieldName.sliceBetweenXandX(':', '-'), 10) - bitPosition + 1;
                                mask = ((Math.pow(2, bitCount) - 1) << bitPosition) >>> 0;
                            }
                            returnValue = (g_clockRegs[clockRegName] & mask) >>> 0;
                            returnValue = (returnValue >>> bitPosition) >>> 0;
                            break;
                        }
                    }

                    if (returnValue !== -1) {
                        break;
                    }
                }

                if (returnValue !== -1) {
                    if (currentNode !== sCLKO && currentNode !== sCLKO_Divider &&
                        currentNode !== sCLKO1 && currentNode !== sCLKO1_Divider) {
                        for (i = 0, max = NUTOOL_CLOCK.g_DIV_Module_Defines.length; i < max; i += 1) {
                            if (currentNode.indexOf(NUTOOL_CLOCK.g_DIV_Module_Defines[i].slicePriorToX(':')) === 0) {
                                currentNode = NUTOOL_CLOCK.g_DIV_Module_Defines[i].sliceAfterX(':');
                            }
                        }
                        if (g_chipType === 'NANO100AN' || g_chipType === 'NANO100BN' ||
                            g_chipType === 'NANO112' || g_chipType === 'NANO103') {
                            returnString = returnString + ", CLK_" + currentNode + "_CLK_DIVIDER(" + (returnValue + 1) + ")";
                        }
                        else if (g_chipType.indexOf("M480") === 0 &&
                            (currentNode.indexOf('USB') === 0 || currentNode.indexOf('OTG') === 0)) {
                            returnString = returnString + ", CLK_" + clockRegName + "_USB(" + (returnValue + 1) + ")";
                        }
                        else if (g_chipType === "MINI57") {
                            if (currentNode.indexOf('ADC') !== -1) {
                                returnString = returnString + ", CLK_CLKDIV_EADC(" + (returnValue + 1) + ")";
                            }
                            else {
                                returnString = returnString + ", CLK_CLKDIV_HCLK(" + (returnValue + 1) + ")";
                            }
                        }
                        else {
                            returnString = returnString + ", CLK_" + clockRegName + "_" + currentNode + "(" + (returnValue + 1) + ")";
                        }
                    }
                    else {
                        returnString = returnString + ", " + returnValue;
                    }
                }
                else {
                    returnString = returnString + ", MODULE_NoMsk";
                }
            }
        }

        return returnString;
    }

    function getFieldDefine1(activatorName, bEnable) {
        var i,
            max,
            j,
            maxJ,
            clockRegName,
            fieldName,
            fullFieldName,
            returnString = "";

        // Activator part
        fieldName = activatorName;

        if (fieldName === 'none') {
            returnString = "MODULE_NoMsk";
        }
        else {
            for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                clockRegName = g_clockRegisterNames[i];
                for (j = 0, maxJ = NUTOOL_CLOCK.g_register_map[clockRegName].length; j < maxJ; j += 1) {
                    fullFieldName = NUTOOL_CLOCK.g_register_map[clockRegName][j];
                    if (fullFieldName.indexOf(fieldName) !== -1 && fullFieldName.indexOf(':') === fieldName.length) {
                        if (bEnable) {
                            returnString = '    CLK->' + clockRegName + ' = CLK->' + clockRegName + ' | CLK_' + clockRegName + '_' + fieldName + '_Msk;\n';
                        }
                        else {
                            returnString = '    CLK->' + clockRegName + ' = CLK->' + clockRegName + ' & ~CLK_' + clockRegName + '_' + fieldName + '_Msk;\n';
                        }
                        break;
                    }
                }

                if (returnString !== "") {
                    break;
                }
            }
        }

        return returnString;
    }
    ///////////////////////////////////// following functions will be invoked by the CDHtmlDialog ///////////////////////////
    function hideElementsByIdArray(idArray) {
        idArray.forEach(function(id) {
            $('#' + id).hide();
        });
    }

    function showChipTypeAndMCU(bShow) {
        if (typeof NUTOOL_PER === 'undefined') {
            if (bShow) {
                $('#ChipType').show();
                $('#MCU').show();
            }
            else {
                $('#ChipType').hide();
                $('#MCU').hide();
            }
        }
    }

    function showLeftPanel() {
        if (typeof NUTOOL_PER === 'undefined') {
            if ($('#ChipType').css('display') === 'none') {
                $('#ChipType').show();
                $('#MCU').show();
                if (g_svgGroup !== null) {
                    $('#searchModule').show();
                }
                $("#tabs").css({ left: g_NUC_TreeView_Width + 8 + 'px' });
                $("#tabs").css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            }
            else {
                $('#ChipType').hide();
                $('#MCU').hide();
                $('#searchModule').hide();
                $("#tabs").css({ left: '0px' });
                $("#tabs").css('width', (g_Dialog_Width - 8) + 'px');
            }
        }
        else {
            if ($('#clockRegsTree').css('display') === 'none') {
                $('#clockRegsTree').show();
                if (g_svgGroup !== null) {
                    $('#searchModule').show();
                }
                $("#tabs").css({ left: g_NUC_TreeView_Width + 8 + 'px' });
                $("#tabs").css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            }
            else {
                $('#clockRegsTree').hide();
                $('#searchModule').hide();
                $("#tabs").css({ left: '0px' });
                $("#tabs").css('width', (g_Dialog_Width - 8) + 'px');
            }
        }
    }

    function loadConfig_core() {
        initializeAll();

        decideChipTypeAndClockRegs();

        //g_bSkipShowWarningForTriggerMultiWayConfigure = true;
        g_bIsTriggerMultiConfiguring = true;
        refresh();
        g_bIsTriggerMultiConfiguring = false;
    }

    function saveConfig() {
        if (checkClockConfigureCorrectness(showClockConfigureError)) {
            try {
                concatenate_g_clockRegsString();
                var text = `/****************************************************************************\r\n`
                    + ` * @file     ${g_partNumber_package}.ncfg\r\n`
                    + ` * @version  ${g_VERSION_CODE}\r\n`
                    + ` * @Date     ${new Date()}\r\n`
                    + ` * @brief    ${g_briefName} clock config file\r\n`
                    + ` *\r\n`
                    + ` * @note Please do not modify this file.\r\n`
                    + ` *       Otherwise, it may not be loaded successfully.\r\n`
                    + ` *\r\n`
                    + ` * SPDX-License-Identifier: Apache-2.0\r\n`
                    + ` *\r\n`
                    + ` * Copyright (C) ${(new Date()).getFullYear()}${g_copyrightCompanyName} All rights reserved.\r\n`
                    + `*****************************************************************************/\r\n`
                    + `MCU:${g_partNumber_package}\r\n`
                    + `${g_clockRegsString}`
                    + `/*** (C) COPYRIGHT ${(new Date()).getFullYear()}${g_copyrightCompanyName} ***/\r\n`
                var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                saveAs(blob, `${g_partNumber_package}.ncfg`);
            } catch (err) {
                console.log("saveConfig failed, meg:" + err);
            }
        }
    }

    function saveNu_config() {
        concatenate_g_clockRegsString();
        var text = `Please do not modify this file. Otherwise, it may not be loaded successfully.\n`
            + `MCU:${g_partNumber_package}\n`
            + `${g_clockRegsString}`;
        try { localStorage.setItem("Nu_config", text); } catch (err) { }
    }

    function generateCode(mode) {
        var i,
            max,
            title,
            projectName,
            content,
            content2,
            checkbox_ModularizeCodeChecked = "checked=true",
            dialogContent,
            validateDialogNameAndPath,
            projectLocationHistorySelect = "",
            projectLocationHistoryText = "",
            projectBrowseButtonText = "",
            projectLocationArray = [],
            checkboxModularize,
            checkboxModularizeType,
            checkboxReviewReportType,
            checkboxModularizeNotSupportedList = ['MINI51DE', 'MINI55', 'NUC029AE', 'NUC100CN', 'NM1200', 'NM1500'],
            checkboxReviewReport,
            buildReviewReportTable,
            sTitle_Module_inner = "",
            sTitle_BusClock_inner = "",
            sTitle_EngineClock_inner = "",
            reviewReportTable = null,
            reviewReportTableHeight,
            tableDataArray = [],
            buttonOk,
            buttonCancel,
            recordedUIlanguage = localStorage.getItem("UIlanguage"),
            recordedChecModularizeCode = "",
            reocrdedPorjectName = "",
            recordedProjectLocation = "",
            recordedProjectLocationHistory = "";

        validateDialogNameAndPath = function (projectName, projectPath) {
            var ii,
                maxII,
                invalidCharArray = ['*', '?', '"', '<', '>', '|'],
                localChar,
                bResult = true;

            for (ii = 0, maxII = invalidCharArray.length; ii < maxII; ii += 1) {
                localChar = invalidCharArray[ii];
                if (projectPath.indexOf(invalidCharArray[ii]) !== -1) {
                    showAlertDialog("工程路径不应该包含" + localChar + "。请修正它。",
                        "專案路徑不應該包含" + localChar + "。請修正它。",
                        "The project path should not contain " + localChar + ". Please fix it.");
                    bResult = false;
                    break;
                }
            }
            invalidCharArray.push('\\');
            invalidCharArray.push('/');
            invalidCharArray.push(':');
            for (ii = 0, maxII = invalidCharArray.length; ii < maxII; ii += 1) {
                localChar = invalidCharArray[ii];
                if (projectName.indexOf(localChar) !== -1) {
                    showAlertDialog("工程名称不应该包含" + localChar + "。请修正它。",
                        "專案名稱不應該包含" + localChar + "。請修正它。",
                        "The project name should not contain " + localChar + ". Please fix it.");
                    bResult = false;
                    break;
                }
            }

            if (!projectPath.charAt(0).match(/^[a-zA-Z]/) ||
                !projectPath.charAt(1).match(/^[:]/) ||
                !projectPath.charAt(2).match(/^[\/\\]/)) {
                showAlertDialog("工程路径开头应为磁碟机代号、磁碟区分隔符号和元件分隔符号(C:\)。请修正它。",
                    "專案路徑開頭應為磁碟機代號、磁碟區分隔符號和元件分隔符號(C:\)。請修正它。",
                    "The project path should begin with a drive letter, a volume separator and a component separator (C:\). Please fix it.");
                bResult = false;
            }
            if (projectName.slice(-1).match(/^[ .]/)) {
                showAlertDialog("工程名称不应以空格或句号结尾。请修正它。",
                    "專案名稱不應以空格或句號結尾。請修正它。",
                    "The project name should not end with a space or peroid. Please fix it.");
                bResult = false;
            }
            return bResult;
        };

        buildReviewReportTable = function () {
            if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                sTitle_Module_inner = "模块";
                sTitle_BusClock_inner = "汇流排频率";
                sTitle_EngineClock_inner = "引擎频率";
            }
            else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                sTitle_Module_inner = "模組";
                sTitle_BusClock_inner = "匯流排頻率";
                sTitle_EngineClock_inner = "引擎頻率";
            }
            else {
                sTitle_Module_inner = "Module";
                sTitle_BusClock_inner = "Bus Clock";
                sTitle_EngineClock_inner = "Engine Clock";
            }
            // build the new table
            if (!$("#reviewReportTable")[0]) {
                $("<div id='reviewReportTable'></div>").insertAfter($("#generateCodeDialogMainPart_div"));
            }
            tableDataArray = g_concatenate_generated_code_begin();
            if (tableDataArray.length > 10) {
                reviewReportTableHeight = "282px";
            }
            else {
                reviewReportTableHeight = "100%";
            }
            if (tableDataArray.length > 0) {
                reviewReportTable = new Tabulator("#reviewReportTable", {
                    height: reviewReportTableHeight, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                    data: tableDataArray, //assign data to table
                    layout: "fitColumns", //fit columns to width of table
                    columns: [ //Define Table Columns
                        { title: sTitle_Module_inner, field: "module" },
                        { title: sTitle_BusClock_inner, field: "busClock" },
                        { title: sTitle_EngineClock_inner, field: "engineClock" }
                    ],
                    rowClick: function (e, row) {
                        if (g_svgGroup !== null) {
                            g_svgGroup.selectAll("g.node").on("searchFromInput")(row._row.data.module);
                            $("#tabs").tabs({ active: 3 });
                            if ($("#tabs").tabs('option', 'active') !== 3) {
                                $("#tabs").tabs({ active: 2 });
                            }
                        }
                    },
                    langs: {
                        "Simplified": {
                            "headerFilters": {
                                "default": "过滤",
                            }
                        },
                        "Traditional": {
                            "headerFilters": {
                                "default": "過濾...",
                            }
                        },
                        "English": {
                            "headerFilters": {
                                "default": "filter...",
                            }
                        }
                    }
                });
                if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                    reviewReportTable.setLocale("Simplified");
                }
                else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                    reviewReportTable.setLocale("Traditional");
                }
                else {
                    reviewReportTable.setLocale("English");
                }
            }
        };
        // entry
        if (!checkClockConfigureCorrectness(showClockConfigureError)) {
            return;
        }


        reocrdedPorjectName = localStorage.getItem("ProjectName");
        if (reocrdedPorjectName == null) {
            reocrdedPorjectName = "";
        }

        recordedProjectLocation = localStorage.getItem("ProjectLocation");
        if (recordedProjectLocation == null) {
            recordedProjectLocation = "";
        }

        recordedProjectLocationHistory = localStorage.getItem("ProjectLocationHistory");
        if (recordedProjectLocationHistory == null) {
            recordedProjectLocationHistory = "";
        }

        if (typeof (recordedUIlanguage) == 'undefined' || recordedUIlanguage == null) {
            title = "Generate Code";
            projectName = 'Project Name';
            content = "Please input a folder path for storing the generated code:";
            content2 = "Please note that the tool is not a replacement for the technical reference manual or datasheet. The user must refer to the latest documentation for the correctness.";
            projectLocationHistoryText = "Or you can choose a folder from recent projects";
            projectBrowseButtonText = "Browse";
            checkboxModularize = "Modularize Code";
            checkboxReviewReport = "Review Report";
            buttonOk = "Confirm";
            buttonCancel = "Leave";
        } else {
            recordedChecModularizeCode = localStorage.getItem("CheckModularizeCode");
            if (recordedChecModularizeCode == null || recordedChecModularizeCode === "No") {
                recordedChecModularizeCode = "No";
                checkbox_ModularizeCodeChecked = "";
            }

            if (recordedUIlanguage === "Simplified Chinese") {
                title = "产生程式码";
                projectName = '工程名称';
                content = "请输入文件夹路径，用于存放生成的代码:";
                content2 = "请注意，本软件不能取代技术参考手册或规格书。用户必须参考最新文档以确保正确性。";
                projectLocationHistoryText = "或是您可以从最近的工程中选择一个";
                projectBrowseButtonText = "浏览";
                checkboxModularize = "模组化代码";
                checkboxReviewReport = "检阅报告";
                buttonOk = "确定";
                buttonCancel = "离开";
            }
            else if (recordedUIlanguage === "Traditional Chinese") {
                title = "產生程式碼";
                projectName = '專案名稱';
                content = "請輸入資料夾路徑，用於存放生成的程式碼:";
                content2 = "請注意，本軟件不能取代技術參考手冊或規格書。用戶必須參考最新文檔以確保正確性。";
                projectLocationHistoryText = "或是您可以從最近的專案中選擇一個";
                projectBrowseButtonText = "瀏覽";
                checkboxModularize = "模組化程式碼";
                checkboxReviewReport = "檢閱報告";
                buttonOk = "確定";
                buttonCancel = "離開";
            }
            else {
                title = "Generate Code";
                projectName = 'Project Name';
                content = "Please input a folder path for storing the generated code:";
                content2 = "Please note that the tool is not a replacement for the technical reference manual or datasheet. The user must refer to the latest documentation for the correctness.";
                projectLocationHistoryText = "Or you can choose a folder from recent projects";
                projectBrowseButtonText = "Browse";
                checkboxModularize = "Modularize Code";
                checkboxReviewReport = "Review Report";
                buttonOk = "Confirm";
                buttonCancel = "Leave";
            }
        }

        if (reocrdedPorjectName.trim() === "") {
            reocrdedPorjectName = "MyProject";
        }
        if (recordedProjectLocationHistory.trim() !== "") {
            projectLocationArray = recordedProjectLocationHistory.split('>');
            projectLocationHistorySelect = '<br /><label><select id="generateCodeDialogSelect" style="width: 450px;height:32px;"><option value="default">' + projectLocationHistoryText + '</option>';
            for (i = 0, max = projectLocationArray.length - 1; i < max; i++) {
                projectLocationHistorySelect += '<option value="' + projectLocationArray[i] + '">' + projectLocationArray[i] + '</option>';
            }
            projectLocationHistorySelect += '</select></label>';
        }

        if (checkboxModularizeNotSupportedList.indexOf(g_chipType) === -1) {
            checkboxModularizeType = "checkbox";
        }
        else {
            checkboxModularize = "";
            checkboxModularizeType = "hidden";
            checkbox_ModularizeCodeChecked = "";
        }
        if (g_svgGroup === null) {
            checkboxReviewReport = "";
            checkboxReviewReportType = "hidden";
        }
        else {
            checkboxReviewReportType = "checkbox";
        }
        // close the last dialog
        removeAlldialogs();
        if (typeof mode === 'undefined') {
            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            dialogContent = '<div id="generateCodeDialogMainPart_div"><label>' + projectName + ': <input type="text" id="inputText_projectName" value="' + reocrdedPorjectName + '" style="width:250px;height:24px;"></label><br /><br /><label><p>' + content2 + '</p></div>';
            dialogContent += '<div id="reviewReportTable"></div>';
            $('<div id="generateCodeDialog">' + dialogContent + '</div>').dialog({
                modal: false,
                resizable: false,
                title: title,
                width: 500,
                height: 'auto',
                show: 'fade',
                hide: 'fade',
                close: function () {
                    $("#generateCodeDialog").dialog("destroy");
                },
                create: function (e, ui) {
                    var pane = $(this).dialog("widget").find(".ui-dialog-buttonpane");
                    if ($('html').hasClass('ie10+')) {
                        $("<div class='generateCodeByModule'><label><input type='" + checkboxModularizeType + "' id='checkbox_ModularizeCode' " + checkbox_ModularizeCodeChecked + "/>" + checkboxModularize + " </label><input type='" + checkboxReviewReportType + "' id='checkbox_ReviewReport'/>" + checkboxReviewReport + "</label></label></div>").prependTo(pane);
                    }
                    else {
                        $("<div class='generateCodeByModule'><label><input type='" + checkboxModularizeType + "' id='checkbox_ModularizeCode' " + checkbox_ModularizeCodeChecked + "/>" + checkboxModularize + " </label></div>").prependTo(pane);
                    }
                },
                buttons: [
                    {
                        id: "generateCodeDialog_buttonOk",
                        text: buttonOk,
                        click: function () {
                            // 先把ProjectName和CheckModularizeCode的值寫入localStorage
                            localStorage.setItem("ProjectName", $('#inputText_projectName').val());
                            if ($("#checkbox_ModularizeCode").is(":checked")) {
                                localStorage.setItem("CheckModularizeCode", "Yes");
                            } else {
                                localStorage.setItem("CheckModularizeCode", "No");
                            }
                            // 本來做的事
                            $("#generateCodeDialog_buttonOk").button("disable");
                            if ($('#inputText_projectName').val().trim() === "") {
                                $('#inputText_projectName').val("MyProject");
                            }
                            try { generateCodeFromJS(); } catch (err) { }
                            // close the last dialog
                            if ($("#generateCodeDialog").dialog("isOpen")) {
                                $("#generateCodeDialog").dialog("destroy");
                            }
                            else {
                                $("#generateCodeDialog_buttonOk").button("enable");
                            }
                        }
                    }
                ]
            });
        }
        else if (mode.indexOf('reviewReport') === 0) {
            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            dialogContent = '<div id="reviewReportTable"><input type="text" size="1" style="position:relative;top:-5000px;"/></div>';
            $('<div id="generateCodeDialog">' + dialogContent + '</div>').dialog({
                modal: false,
                resizable: false,
                title: checkboxReviewReport,
                width: 500,
                height: 'auto',
                show: 'fade',
                hide: 'fade',
                close: function () {
                    $("#generateCodeDialog").dialog("destroy");
                },
                buttons: [
                    {
                        id: "generateCodeDialog_buttonOk",
                        text: buttonOk,
                        click: function () {
                            if (mode.indexOf('runAnotherTool') !== -1) {
                                runAnotherTool();
                            }
                            else {
                                // close the last dialog
                                if ($("#generateCodeDialog").dialog("isOpen")) {
                                    $("#generateCodeDialog").dialog("destroy");
                                }
                            }
                        }
                    }
                ]
            });
            // create the content of review table
            buildReviewReportTable();
        }
        // handle events
        $('#generateCodeDialogInput').keypress(function (e) {
            switch (e.which) {
                case 22: //ctrl + v
                    $("#generateCodeDialogInput").val(window.clipboardData.getData("Text"));
                    break;
            }
        });
        $('#generateCodeDialogBrowseFolder').click(function () {
            if ($('#inputText_projectName').val().trim() === "") {
                $('#inputText_projectName').val("MyProject");
            }
            try { generateCodeFromJS(); } catch (err) { }
            if (NUTOOL_CLOCK.g_clockFunctionString !== "" &&
                NUTOOL_CLOCK.g_clockFunctionString.indexOf(':') !== -1) {
                $("#generateCodeDialogInput").val(NUTOOL_CLOCK.g_clockFunctionString);
            }
            $("#generateCodeDialog").focus();
        });
        $("#generateCodeDialogSelect").change(function () {
            if ($("#generateCodeDialogSelect").val() !== "default") {
                $("#generateCodeDialogInput").val($("#generateCodeDialogSelect").val());
                $("#generateCodeDialogSelect").val($("#generateCodeDialogSelect option:first-child").val());
            }
        });
        $("#checkbox_ReviewReport").change(function () {
            if ($('#checkbox_ReviewReport').is(':checked')) {
                buildReviewReportTable();
                $('#generateCodeDialogMainPart_div').hide();
                $('#generateCodeDialogTableWrapper').show();
                $("#generateCodeDialog_buttonOk").button("disable");
            }
            else {
                // remove the last table
                $('#reviewReportTable').remove();
                $('#generateCodeDialogMainPart_div').show();
                $('#generateCodeDialogTableWrapper').hide();
                $("#generateCodeDialog_buttonOk").button("enable");
            }
        });
    }

    function generateCodeFromJS(mode) {
        if ($("#checkbox_ModularizeCode").is(":checked")) {
            concatenate_generated_modularizedCode();

            // Generate .c
            var textc = `/****************************************************************************\n`
                + ` * @file     ${$('#inputText_projectName').val()}.c\n`
                + ` * @version  ${g_VERSION_CODE}\n`
                + ` * @Date     ${new Date()}\n`
                + ` * @brief    ${g_briefName} generated code file\n`
                + ` *\n`
                + ` * SPDX-License-Identifier: Apache-2.0\n`
                + ` *\n`
                + ` * Copyright (C) ${(new Date()).getFullYear()}${g_copyrightCompanyName} All rights reserved.\n`
                + `*****************************************************************************/\n`
                + `\n`
                + `/********************\n`
                + `MCU:${g_partNumber_package}\n`
                + `${g_clockRegsString}`
                + `/*** (C) COPYRIGHT ${(new Date()).getFullYear()}${g_copyrightCompanyName} ***/\n`
            // 不知道怎麼從concatenate_generated_modularizedCode()中把NuCodeGenProj取代成projectName，所以手動replace
            textc = textc.replaceAll('NuCodeGenProj', `${$('#inputText_projectName').val()}`)
            var blobc = new Blob([textc], { type: "text/plain;charset=utf-8" });
            saveAs(blobc, `${$('#inputText_projectName').val()}.c`);

            // Generate .h
            var texth = `/****************************************************************************\n`
                + ` * @file     ${$('#inputText_projectName').val()}.h\n`
                + ` * @version  ${g_VERSION_CODE}\n`
                + ` * @Date     ${new Date()}\n`
                + ` * @brief    ${g_briefName} generated code file\n`
                + ` *\n`
                + ` * SPDX-License-Identifier: Apache-2.0\n`
                + ` *\n`
                + ` * Copyright (C) ${(new Date()).getFullYear()}${g_copyrightCompanyName} All rights reserved.\n`
                + `*****************************************************************************/\n\n`
                + `#ifndef __${$('#inputText_projectName').val().toUpperCase()}_H__\n`
                + `#define __${$('#inputText_projectName').val().toUpperCase()}_H__\n\n`
                + `#ifdef __cplusplus\nextern \"C\"\n{\n#endif\n`
                + `${g_clockRegsString2}`
                + `#ifdef __cplusplus\n}\n#endif\n`
                + `#endif /*__${$('#inputText_projectName').val().toUpperCase()}_H__*/\n\n`
                + `/*** (C) COPYRIGHT ${(new Date()).getFullYear()}${g_copyrightCompanyName} ***/\n`
            // 不知道怎麼從concatenate_generated_modularizedCode()中把NuCodeGenProj取代成projectName，所以手動replace
            texth = texth.replaceAll('NuCodeGenProj', `${$('#inputText_projectName').val()}`)
            var blobh = new Blob([texth], { type: "text/plain;charset=utf-8" });
            saveAs(blobh, `${$('#inputText_projectName').val()}.h`);


            // Generate nutool_clkcfg.h
            var textclkcfg = `/****************************************************************************\n`
                + ` * @file     nutool_clkcfg.h\n`
                + ` * @version  ${g_VERSION_CODE}\n`
                + ` * @Date     ${new Date()}\n`
                + ` * @brief    ${g_briefName} generated code file\n`
                + ` *\n`
                + ` * SPDX-License-Identifier: Apache-2.0\n`
                + ` *\n`
                + ` * Copyright (C) ${(new Date()).getFullYear()}${g_copyrightCompanyName} All rights reserved.\n`
                + `*****************************************************************************/\n\n`
                + `#ifndef __NUTOOL_CLKCFG_H__\n`
                + `#define __NUTOOL_CLKCFG_H__\n\n`
                + `#ifdef __cplusplus\nextern \"C\"\n{\n#endif\n`
                + `${g_clockRegsString1}`
                + `#ifdef __cplusplus\n}\n#endif\n`
                + `#endif /*__NUTOOL_CLKCFG_H__*/\n\n`
                + `/*** (C) COPYRIGHT ${(new Date()).getFullYear()}${g_copyrightCompanyName} ***/\n`
            // 不知道怎麼從concatenate_generated_modularizedCode()中把NuCodeGenProj取代成projectName，所以手動replace
            textclkcfg = textclkcfg.replaceAll('NuCodeGenProj', `${$('#inputText_projectName').val()}`)
            var blobtextclkcfg = new Blob([textclkcfg], { type: "text/plain;charset=utf-8" });
            saveAs(blobtextclkcfg, `nutool_clkcfg.h`);
        }
        else {
            concatenate_generated_code(mode);
            var textc = `/****************************************************************************\n`
                + ` * @file     ${$('#inputText_projectName').val()}.c\n`
                + ` * @version  ${g_VERSION_CODE}\n`
                + ` * @Date     ${new Date()}\n`
                + ` * @brief    ${g_briefName} generated code file\n`
                + ` *\n`
                + ` * SPDX-License-Identifier: Apache-2.0\n`
                + ` *\n`
                + ` * Copyright (C) ${(new Date()).getFullYear()}${g_copyrightCompanyName} All rights reserved.\n`
                + `*****************************************************************************/\n`
                + `\n`
                + `/********************\n`
                + `MCU:${g_partNumber_package}\n`
                + `${g_clockRegsString}`
                + `/*** (C) COPYRIGHT ${(new Date()).getFullYear()}${g_copyrightCompanyName} ***/\n`

            if (typeof mode !== 'undefined' && mode.indexOf('EmbeetleIDE') === 0) {
                window.bridge.generateCodeClockConfigFromJS(textc);
            } else {
                let blobc = new Blob([textc], { type: "text/plain;charset=utf-8" });
                saveAs(blobc, `${$('#inputText_projectName').val()}.c`);
            }
        }

        // Generate .cfg
        saveConfig();
    }

    function concatenate_g_clockRegsString() {
        var i,
            max,
            sHXT = 'HXT'.toEquivalent().toString(),
            sPLL = 'PLL'.toEquivalent().toString();

        g_clockRegsString = "";
        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            g_clockRegsString += 'Reg:' + g_clockRegisterNames[i] + ' = 0x' + decimalToHex(g_clockRegs[g_clockRegisterNames[i]]).toUpperCase() + '\r\n';
        }
        // record the mutable frequencies of sources
        //window.alert(g_realLXToutputClock + '/' + g_realHXToutputClock)
        if (g_realLXToutputClock > 0) {
            g_clockRegsString += 'LXT:' + g_realLXToutputClock + '\r\n';
        }
        if (g_realHXToutputClock > 0) {
            g_clockRegsString += sHXT + ':' + g_realHXToutputClock + '\r\n';
        }
        if (g_realRTC32koutputClock > 0) {
            g_clockRegsString += 'RTC32k:' + g_realRTC32koutputClock + '\r\n';
        }
        if (g_realPLLoutputClock > 0) {
            g_clockRegsString += sPLL + ':' + g_realPLLoutputClock + '\r\n';
        }
        if (g_realPLL2outputClock > 0) {
            g_clockRegsString += 'PLL2:' + g_realPLL2outputClock + '\r\n';
        }
        if (g_realPLL480MoutputClock > 0) {
            g_clockRegsString += 'PLL480M:' + g_realPLL480MoutputClock + '\r\n';
        }
        if (g_realAPLLoutputClock > 0) {
            g_clockRegsString += 'APLL:' + g_realAPLLoutputClock + '\r\n';
        }
        if (g_realPLLFNoutputClock > 0) {
            g_clockRegsString += 'PLLFN:' + g_realPLLFNoutputClock + '\r\n';
        }
        if (g_realHSUSBOTGPHYoutputClock > 0) {
            g_clockRegsString += 'HSUSB_OTG_PHY:' + g_realHSUSBOTGPHYoutputClock + '\r\n';
        }

        g_clockRegsString += 'Step:' + g_finalStep + '\r\n';

        i = null;
        max = null;
    }

    function concatenate_generated_code(command) {
        // in the beginning
        g_concatenate_generated_code_begin(command);
        // for individual modules
        g_concatenate_generated_code_internal(command);
        // in the end
        //g_concatenate_generated_code_end(command);
        g_clockRegsString = g_concatenate_generated_code_end();
    }

    function concatenate_generated_modularizedCode() {
        // in the beginning
        g_concatenate_generated_code_begin('modularizeCode');
        // in the end
        g_concatenate_generated_code_end();
    }

    function receiveMessageFromPythonApp(message) {
        if (message.indexOf('generateCode') === 0) {
            generateCodeFromJS('EmbeetleIDE');
        }
    }

    function synchronizeWithTargetPartNumber(newPartNumber_package) {
        var newChipType;

        if (newPartNumber_package.toUpperCase() !== 'UNKNOWN') {
            // reload the corresponding chip content
            newChipType = decideNewChipType(newPartNumber_package);
            $("#ChipTypeSelect").val(newChipType).change();
        }
    }


    function getGeneratedClockStatus() {
        var i,
            j,
            max,
            maxJ,
            currentNode,
            moduleNames = getPropertyNames(NUTOOL_CLOCK.g_Module),
            enableField,
            enableFieldArray,
            whileCount,
            bChecked,
            localObject = {};

        // Enabled-Module Frequencies
        g_clockRegsString = ":";
        for (i = 0, max = moduleNames.length; i < max; i += 1) {
            currentNode = moduleNames[i];
            g_clockRegsString += currentNode + "/:";
            enableField = NUTOOL_CLOCK.g_Module[currentNode][1];
            enableFieldArray = [];
            whileCount = 0;
            if (enableField.indexOf('/') === -1) {
                enableFieldArray.push(enableField);
            }
            else {
                while (enableField.indexOf('/') !== -1) {
                    enableFieldArray.push(enableField.slicePriorToX('/'));
                    enableField = enableField.sliceAfterX('/');

                    whileCount = whileCount + 1;
                    if (whileCount > 10) {
                        break;
                    }
                }

                enableFieldArray.push(enableField);
            }
            bChecked = true;
            for (j = 0, maxJ = enableFieldArray.length; j < maxJ; j += 1) {
                if (!isEnabled(enableFieldArray[j])) {
                    bChecked = false;
                    break;
                }
            }

            if (bChecked) {
                g_clockRegsString += currentNode + '=Enabled:';
                localObject[currentNode] = $("#" + currentNode + "_span_showRealFreq").text().trim();
            }
        }
        g_clockRegsString1 = JSON.stringify(localObject);
    }

    function pageRefresh() {
        var i,
            max;

        showWarningForSaving(function () {
            if (g_clockRegTreesLoaded) {
                g_clockRegTreesLoaded = false;
                initializeAll();
                NUTOOL_CLOCK.g_readConfigFilePath = 'dummyPath';
                // get g_clockRegisterNames
                g_clockRegisterNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_default);
                // get g_clockRegs
                g_clockRegs = [];
                for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
                    g_clockRegs[g_clockRegisterNames[i]] = parseInt(NUTOOL_CLOCK.g_register_map_default[g_clockRegisterNames[i]], 16);
                }

                refresh();
            }
            // record the latest g_gpio_MFPs
            recordConfig();
        });
    }

    function switchD3ClockTree() {
        if (g_svgGroup !== null) {
            g_bSwitchD3ClockTree = !g_bSwitchD3ClockTree;
            triggerMultiWayConfigure_yes(g_finalStep - 1 - 1);
            $("#tabs").tabs({ active: g_finalStep - 1 });
        }
    }

    function zoomIn() {
        if (g_svgGroup !== null) {
            g_zoomScale = g_zoomScale + 0.3;
            g_svgGroup.selectAll("g.node").on("zoomFromToolbar")(g_zoomScale);
        }
    }

    function bestFit() {
        if (g_svgGroup !== null) {
            g_zoomScale = 1;
            g_svgGroup.selectAll("g.node").on("zoomFromToolbar")(1);
        }
    }

    function zoomOut() {
        if (g_svgGroup !== null) {
            g_zoomScale = g_zoomScale - 0.3;
            if (g_zoomScale <= 0) {
                g_zoomScale = 0.3;
            }
            g_svgGroup.selectAll("g.node").on("zoomFromToolbar")(g_zoomScale);
        }
    }

    function uncheckAllNodes() {
        if (g_svgGroup !== null) {
            showWarningForSaving(function () {
                uncheckAllNodes_core();
                // record the latest g_gpio_MFPs
                recordConfig();
            });
        }
    }

    function setLanguage() {
        var title,
            content,
            engiish,
            simplifiedChinese,
            traditionalChinese,
            engiishChecked = "",
            simplifiedChineseChecked = "",
            traditionalChineseChecked = "",
            buttonOk,
            buttonCancel,
            mcu_inner,
            chipType_inner,
            clock_tree_inner,
            searchModule_inner,
            enable_inner,
            disable_inner,
            wait_inner,
            cycles_inner,
            specificRealOutput_before_span,
            realOutput_before_inner,
            realOutput_after_inner,
            nextStep_inner,
            base_clocks_inner,
            pll_clocks_inner,
            module_inner,
            no_pll_inner,
            title_inner,
            sPLL = 'PLL'.toEquivalent().toString(),
            bLanguageChanged = false;

        if (!g_bAvoidClicking) {
            if (g_userSelectUIlanguage === "Simplified Chinese") {
                title = "设定";
                content = "从下面选取一个语言显示在操作介面上。";
                engiish = "英文";
                simplifiedChinese = "简体中文";
                traditionalChinese = "繁体中文";
                simplifiedChineseChecked = "checked";
                buttonOk = "确定";
                buttonCancel = "离开";
            }
            else if (g_userSelectUIlanguage === "Traditional Chinese") {
                title = "設定";
                content = "從下面選取一個語言顯示在操作介面上。";
                engiish = "英文";
                simplifiedChinese = "简體中文";
                traditionalChinese = "繁體中文";
                traditionalChineseChecked = "checked";
                buttonOk = "確定";
                buttonCancel = "離開";
            }
            else {
                title = "Settings";
                content = "Select one of the following languages displayed in UI.";
                engiish = "English";
                simplifiedChinese = "Simplified Chinese";
                traditionalChinese = "Traditional Chinese";
                engiishChecked = "checked";
                buttonOk = "Confirm";
                buttonCancel = "Leave";
            }

            // close the last dialog
            if ($('#languageDialog').is(':visible')) {
                $('#languageDialog').dialog("destroy");
            }

            // JQuery sets the autofocus on the first input that is found. So play it sneaky by creating a "fake" input at the last line of your dialog
            $('<div id="languageDialog"><p>' + content + '</p><input type="radio" id="engiish" value="English" name="UIlanguage" ' + engiishChecked + '><label for="engiish">' + engiish + '</label><br /><input type="radio" id="simplifiedChinese" value="Simplified Chinese" name="UIlanguage" ' + simplifiedChineseChecked + '><label for="simplifiedChinese">' + simplifiedChinese + '</label><br /><input type="radio" id="traditionalChinese" value="Traditional Chinese" name="UIlanguage" ' + traditionalChineseChecked + '><label for="traditionalChinese">' + traditionalChinese + '</label><br /><input type="text" size="1" style="position:relative;top:-5000px;"/></div>')
                .dialog({
                    modal: false,
                    draggable: false,
                    resizable: false,
                    title: title,
                    width: 500,
                    height: 'auto',
                    show: 'fade',
                    hide: 'fade',
                    buttons: [
                        {
                            text: buttonOk,
                            click: function () {
                                // iterate radio buttons
                                $("input").each(function () {
                                    if (this.checked === true && $(this).val() !== "on") {
                                        if (g_userSelectUIlanguage !== $(this).val()) {
                                            bLanguageChanged = true;
                                        }
                                        g_userSelectUIlanguage = $(this).val();
                                        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
                                            mcu_inner = '型号';
                                            chipType_inner = '晶片系列:';
                                            clock_tree_inner = 'Clock寄存器';
                                            searchModule_inner = '搜寻模块';
                                            enable_inner = '启用';
                                            disable_inner = '停用';
                                            wait_inner = '等待';
                                            cycles_inner = '周期';
                                            specificRealOutput_before_span = '';
                                            realOutput_before_inner = '模块';
                                            realOutput_after_inner = '的时脉频率: ';
                                            nextStep_inner = '下一步';
                                            base_clocks_inner = '基础时脉源';
                                            pll_clocks_inner = sPLL;
                                            module_inner = '模块';
                                            no_pll_inner = '没有' + sPLL + '相关的时脉源可供使用。';
                                            title_inner = '输入期望值';
                                        }
                                        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
                                            mcu_inner = '型號';
                                            chipType_inner = '晶片系列:';
                                            clock_tree_inner = 'Clock暂存器';
                                            searchModule_inner = '搜尋模組';
                                            enable_inner = '啟用';
                                            disable_inner = '停用';
                                            wait_inner = '等待';
                                            cycles_inner = '週期';
                                            specificRealOutput_before_span = '';
                                            realOutput_before_inner = '模組';
                                            realOutput_after_inner = '的時脈頻率: ';
                                            nextStep_inner = '下一步';
                                            base_clocks_inner = '基礎時脈源';
                                            pll_clocks_inner = sPLL;
                                            module_inner = '模組';
                                            no_pll_inner = '沒有' + sPLL + '相關的時脈源可供使用。';
                                            title_inner = '輸入期望值';
                                        }
                                        else {
                                            mcu_inner = 'Part No.';
                                            chipType_inner = 'Chip Series:';
                                            clock_tree_inner = 'Clock Registers';
                                            searchModule_inner = 'Search Module';
                                            enable_inner = 'Enable';
                                            disable_inner = 'Disable';
                                            wait_inner = 'Wait';
                                            cycles_inner = 'cycles';
                                            specificRealOutput_before_span = 'The clock of ';
                                            realOutput_before_inner = 'The clock of ';
                                            realOutput_after_inner = ': ';
                                            nextStep_inner = 'Next Step';
                                            base_clocks_inner = 'Base Clocks';
                                            pll_clocks_inner = sPLL;
                                            module_inner = 'Module';
                                            no_pll_inner = 'There are no ' + sPLL + '-related clock sources available.';
                                            title_inner = 'Input the expected value';
                                        }

                                        $("#MCU_span").text(mcu_inner);
                                        $("#ChipType_span").text(chipType_inner);
                                        $("#clockRegsTree").jstree('rename_node', $("#clock_tree"), clock_tree_inner);
                                        $("#searchModule_span").text(searchModule_inner);
                                        $(".enable_span").text(enable_inner);
                                        $(".disable_span").text(disable_inner);
                                        $(".wait_span").text(wait_inner);
                                        $(".cycles_span").text(cycles_inner);
                                        $(".specificRealOutput_before_span").text(specificRealOutput_before_span);
                                        $(".realOutput_before_span").text(realOutput_before_inner);
                                        $(".realOutput_after_span").text(realOutput_after_inner);
                                        if ($("#add-tab-1")[0]) {
                                            $("#add-tab-1")[0].innerHTML = nextStep_inner;
                                        }
                                        if ($("#add-tab-2")[0]) {
                                            $("#add-tab-2")[0].innerHTML = nextStep_inner;
                                        }
                                        if ($("#add-tab-3")[0]) {
                                            $("#add-tab-3")[0].innerHTML = nextStep_inner;
                                        }
                                        $("#base_clocks_span").text(base_clocks_inner);
                                        $("#pll_clocks_span").text(pll_clocks_inner);
                                        $("#module_span").text(module_inner);
                                        $("#no_pll_span").text(no_pll_inner);
                                        $('[title]').prop('title', title_inner);

                                        // adjust the width of search input
                                        $("#searchInput").css({ left: ($("#searchModule_span").width() + 10) + 'px' });
                                        $("#searchInput").css('width', (g_NUC_TreeView_Width - 16 - $("#searchModule_span").width() - 10) + 'px');
                                        try { localStorage.setItem("UIlanguage", $(this).val()); } catch (err) { }

                                        if ($('#languageDialog').is(':visible')) {
                                            $('#languageDialog').dialog("destroy");
                                        }
                                    }
                                });
                            }
                        },
                        {
                            text: buttonCancel,
                            click: function () {
                                if (g_userSelectUIlanguage === "") {
                                    g_userSelectUIlanguage = "English";
                                }

                                if ($(this).is(':visible')) {
                                    $(this).dialog("destroy");
                                }
                            }
                        }
                    ],
                    close: function () {
                        $(this).dialog("destroy");
                    }
                });
        }
    }

    function changeUIlanguage() {
        var searchModule_inner,
            clock_tree_inner,
            mcu_inner,
            chipType_inner,
            enable_inner,
            disable_inner,
            wait_inner,
            cycles_inner,
            specificRealOutput_before_span,
            realOutput_before_inner,
            realOutput_after_inner,
            nextStep_inner,
            base_clocks_inner,
            pll_clocks_inner,
            module_inner,
            no_pll_inner,
            title_inner,
            sPLL = 'PLL'.toEquivalent().toString();

        decideUIlanguage();
        if (g_userSelectUIlanguage.indexOf("Simplified") !== -1) {
            mcu_inner = '型号';
            chipType_inner = '晶片系列:';
            clock_tree_inner = 'Clock寄存器';
            searchModule_inner = '搜寻模块';
            enable_inner = '启用';
            disable_inner = '停用';
            wait_inner = '等待';
            cycles_inner = '周期';
            specificRealOutput_before_span = '';
            realOutput_before_inner = '模块';
            realOutput_after_inner = '的时脉频率: ';
            nextStep_inner = '下一步';
            base_clocks_inner = '基础时脉源';
            pll_clocks_inner = sPLL;
            module_inner = '模块';
            no_pll_inner = '没有' + sPLL + '相关的时脉源可供使用。';
            title_inner = '输入期望值';
        }
        else if (g_userSelectUIlanguage.indexOf("Traditional") !== -1) {
            mcu_inner = '型號';
            chipType_inner = '晶片系列:';
            clock_tree_inner = 'Clock暂存器';
            searchModule_inner = '搜尋模組';
            enable_inner = '啟用';
            disable_inner = '停用';
            wait_inner = '等待';
            cycles_inner = '週期';
            specificRealOutput_before_span = '';
            realOutput_before_inner = '模組';
            realOutput_after_inner = '的時脈頻率: ';
            nextStep_inner = '下一步';
            base_clocks_inner = '基礎時脈源';
            pll_clocks_inner = sPLL;
            module_inner = '模組';
            no_pll_inner = '沒有' + sPLL + '相關的時脈源可供使用。';
            title_inner = '輸入期望值';
        }
        else {
            mcu_inner = 'Part No.';
            chipType_inner = 'Chip Series:';
            clock_tree_inner = 'Clock Registers';
            searchModule_inner = 'Search Module';
            enable_inner = 'Enable';
            disable_inner = 'Disable';
            wait_inner = 'Wait';
            cycles_inner = 'cycles';
            specificRealOutput_before_span = 'The clock of ';
            realOutput_before_inner = 'The clock of ';
            realOutput_after_inner = ': ';
            nextStep_inner = 'Next Step';
            base_clocks_inner = 'Base Clocks';
            pll_clocks_inner = sPLL;
            module_inner = 'Module';
            no_pll_inner = 'There are no ' + sPLL + '-related clock sources available.';
            title_inner = 'Input the expected value';
        }

        $("#MCU_span").text(mcu_inner);
        $("#ChipType_span").text(chipType_inner);
        $("#clockRegsTree").jstree('rename_node', $("#clock_tree"), clock_tree_inner);
        $("#searchModule_span").text(searchModule_inner);
        $(".enable_span").text(enable_inner);
        $(".disable_span").text(disable_inner);
        $(".wait_span").text(wait_inner);
        $(".cycles_span").text(cycles_inner);
        $(".specificRealOutput_before_span").text(specificRealOutput_before_span);
        $(".realOutput_before_span").text(realOutput_before_inner);
        $(".realOutput_after_span").text(realOutput_after_inner);
        if ($("#add-tab-1")[0]) {
            $("#add-tab-1")[0].innerHTML = nextStep_inner;
        }
        if ($("#add-tab-2")[0]) {
            $("#add-tab-2")[0].innerHTML = nextStep_inner;
        }
        if ($("#add-tab-3")[0]) {
            $("#add-tab-3")[0].innerHTML = nextStep_inner;
        }
        $("#base_clocks_span").text(base_clocks_inner);
        $("#pll_clocks_span").text(pll_clocks_inner);
        $("#module_span").text(module_inner);
        $("#no_pll_span").text(no_pll_inner);
        $('[title]').prop('title', title_inner);

        // adjust the width of search input
        $("#searchInput").css({ left: ($("#searchModule_span").width() + 10) + 'px' });
        $("#searchInput").css('width', (g_NUC_TreeView_Width - 16 - $("#searchModule_span").width() - 10) + 'px');
    }

    function executePDFfail() {
        showAlertDialog("您的电脑不能执从PDF档。请安装必要的软件来支援它。",
            "您的電腦不能執從PDF檔。請安裝必要的軟件來支援它。",
            "Your PC is incapable of executing the PDF files. Please install a necessary software to support it.");
    }

    function handleEnter() {
        $("#" + g_clickedElementId).change();
    }

    function redrawForResizingDialog() {
        var $tabs = $("#tabs");

        decideDialogSize();
        // adjust the size of the relevant UI elements
        if ($('#clockRegsTree').css('display') !== 'none') {
            $tabs.css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
            $tabs.css({ left: g_NUC_TreeView_Width + 8 + 'px' });
        }
        else {
            $tabs.css('width', (g_Dialog_Width - 8) + 'px');
            $tabs.css({ left: '0px' });
        }
        $tabs.css('height', (g_Dialog_Height - 8) + 'px');
        $('#tab-4').css('width', (g_Dialog_Width - g_NUC_TreeView_Width - 8) + 'px');
        $('#tab-4').css('height', (g_Dialog_Height - 8) + 'px');

        $tabs = null;
    }

    function recordConfig() {
        var i,
            max;

        g_saved_clockRegs = [];
        for (i = 0, max = g_clockRegisterNames.length; i < max; i += 1) {
            g_saved_clockRegs[g_clockRegisterNames[i]] = g_clockRegs[g_clockRegisterNames[i]];
        }
    }

    function closeAPP() {
        if (checkClockConfigureCorrectness(showClockConfigureErrorForCloseApp)) {
            showWarningForSaving(function () {
                saveNu_config();
            });
        }
    }

    function loadClockConfigureTool() {
        if (determineIEversion()) { return; } // determine the installed IE version
        decideUIlanguage(); // for toolbar tips

        decideDialogSize();
        decideChipTypeAndClockRegs();

        // construct trees
        $('#rootTree_Clock')[0].setAttribute('style', 'width:' + g_NUC_TreeView_Width + 'px; height: ' + g_NUC_TreeView_Height + 'px;');
        if (typeof NUTOOL_PER === 'undefined') {
            buildChipTypeSelect();
        }
        else {
            if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
                g_finalStep = 4;
            }
            else {
                g_finalStep = 3;
            }
        }
        buildClockRegsTree();

        g_bIsTriggerMultiConfiguring = true;
        buildRefClockTab();
        g_bIsTriggerMultiConfiguring = false;

        constrainMouseClick();
        if (typeof NUTOOL_PER !== 'undefined') {
            $("#tabs")[0].style.visibility = 'hidden';
            $('#rootTree_Clock').hide();
        }
        // the following is used for testing. When the driver is being released, we should comment them.
        if (typeof NUTOOL_PER === 'undefined' && !g_bReadyForRelease) {
            decideHotKeys();
        }
    }

    function initPythonAppRelatedSettings() {
        // search parameter from URL
        var url = new URL(window.location.href),
            searchParams = new URLSearchParams(url.search);

        g_urlParameter = searchParams.get('param1');
        g_bInvokedByCDHtmlDialog = true;

        try {
            // create a web channel to interact with a python app
            new QWebChannel(qt.webChannelTransport, function(channel) {
                window.bridge = channel.objects.ClockConfig_bridge;
            });
        }
        catch (err) { }
    }

    function initListeners() {
        $('#ID_BUTTON_SHOW_REGISTERS').on('click', function () {
            showLeftPanel();
        });
        $('#ID_BUTTON_LOAD').on('click', function () {
            loadConfigByBrowser();
        });
        $('#loadConfiguration').on('change', loadConfiguration);
        $('#ID_BUTTON_SAVE').on('click', function () {
            saveConfig();
        });
        $('#ID_BUTTON_GENERATE_CODE').on('click', function () {
            if (g_urlParameter === 'EmbeetleIDE') {
                generateCodeFromJS('EmbeetleIDE');
            }
            else {
                generateCode();
            }
        });
        $('#ID_BUTTON_CONNECT_TO_TARGET').on('click', function () {
            showWarningForSaving(function () {
                connectToChip();
            });
        });
        $('#ID_BUTTON_RETURN_DEFAULT').on('click', function () {
            pageRefresh();
        });
        $('#ID_BUTTON_SWITCH_CLOCK_TREE').on('click', function () {
            switchD3ClockTree();
        });
        // $('#ID_BUTTON_ZOOM_IN').on('click', function () {
        //     zoomIn();
        // });
        // $('#ID_BUTTON_BEST_FIT').on('click', function () {
        //     bestFit();
        // });
        // $('#ID_BUTTON_ZOOM_OUT').on('click', function () {
        //     zoomOut();
        // });
        $('#ID_BUTTON_DISABLE').on('click', function () {
            uncheckAllNodes();
        });
        $('#ID_BUTTON_LANGUAGE').on('click', function () {
            setLanguage();
        });
        $('#ID_BUTTON_INSTRUCTION').on('click', function () {
        });
    }

    function loadConfigByBrowser() {
        if ($('#rootTree_Clock').is(':visible')) {
            showWarningForSaving(function () {
                $('#loadConfiguration').trigger('click');
            });
        }
    }

    function loadConfiguration() {
        if (this.files[0] == undefined || this.files[0] == null) return;
        var extension = this.files[0].name.split('.').pop().toLowerCase();  // file extension from input file
        if (extension.indexOf('ncfg') == -1) {
            alert("Please select a file with a valid file type. (.ncfg)")
            return;
        }
        var uploadedFile = this.files[0];
        var fileReader = new FileReader();
        fileReader.readAsText(uploadedFile)
        fileReader.onload = function (reader) {
            NUTOOL_CLOCK.g_readConfigFileContentText = reader.target.result;
            NUTOOL_CLOCK.g_readConfigFilePath = URL.createObjectURL(uploadedFile);
            try {
                replaceJsFile(loadConfig_core);
            }
            catch (err) { }
        }
    }

    // 由於中間的replacejscssfile部分不好拆成用callback的方式，所以用暴力法在正式loadConfig_core前先手動load一次js檔
    function replaceJsFile(callback) {
        //window.alert(NUTOOL_CLOCK.g_readConfigFilePath)
        var bCorrectpartNumber_package = false,
            newReadConfigFile = "",
            newPartNumber_package = "",
            newChipType = "",
            oldfilename,
            newfilename,
            bCorrectChipSeries = false;

        g_readConfigFile = "";

        saved_newReadConfigFile = newReadConfigFile = NUTOOL_CLOCK.g_readConfigFileContentText;
        // find the '\r' pertaining to 'MCU:'
        while (newReadConfigFile.indexOf('\r') !== -1 && (newReadConfigFile.indexOf('\r') < newReadConfigFile.indexOf('MCU:'))) {
            newReadConfigFile = newReadConfigFile.sliceAfterX('\r');
        }

        newPartNumber_package = newReadConfigFile.sliceBetweenXandX('MCU:', '\r');

        newPartNumber_package = newPartNumber_package.trim();
        newChipType = decideNewChipType(newPartNumber_package);
        // check if newChipType is correct
        if ($.inArray(chipTypeToChipSeries(newChipType), g_chipTypes) === -1) {
            showAlertDialog("从配置档读出的晶片型号 " + newChipType + " 不正确。",
                "從配置檔讀出的晶片型號 " + newChipType + " 不正確。",
                "The chip type of " + newChipType + " read from the config file is incorrect.");

            bCorrectpartNumber_package = null;
            newReadConfigFile = null;
            newPartNumber_package = null;
            newChipType = null;

            return bCorrectpartNumber_package;
        }

        // reload the corresponding chip content
        if (typeof (g_chipType) !== 'undefined' && g_chipType !== "") {
            oldfilename = 'NUC_' + g_chipType + '_Content.js';
            newfilename = 'NUC_' + newChipType + '_Content.js';

            replacejscssfile(oldfilename, newfilename, 'js', callback);
        }
        else {
            if (typeof NUTOOL_PER === 'undefined') {
                oldfilename = 'NUC_NUC400_Content.js';
            }
            else {
                oldfilename = 'NUC_M251_Content.js';
            }
            newfilename = 'NUC_' + newChipType + '_Content.js';

            replacejscssfile(oldfilename, newfilename, 'js', callback);
        }

        // get g_readConfigFile
        g_readConfigFile = newReadConfigFile;
        // get g_chipType
        g_chipType = newChipType;
        // get g_partNumber_package
        g_partNumber_package = newPartNumber_package;
    }

    async function connectToChip() {
        var connDevice;
        if (g_worker != undefined) {
            // 先確認現在有沒有連上device
            await navigator.usb.getDevices().then((devices) => {
                devices.forEach((device) => {
                    connDevice = device;
                });
            }).catch(error => {
                console.log(error);
                connDevice = undefined;
            });
            // 如果沒有連上任何device的話，執行requestDevice()讓使用者選擇device
            if (connDevice == undefined) {
                connDevice = await navigator.usb.requestDevice({
                    filters: [{ vendorId: 0x0416 }]
                }).catch(error => {
                    console.log(error);
                    connDevice = undefined;
                });
            }
            // 選到任一裝置後，叫worker進行讀PID的動作
            if (connDevice != undefined) {
                g_worker.postMessage({ 'action': 'connect' });
            }
        }
    }

    function setWorkerListener() {
        g_worker.onmessage = async function (e) {
            let action = e.data.action;
            let data = e.data;
            if (action == 'connected') {
                // 確認連接後取PIDValue
                g_deviceConnected = true;
                g_worker.postMessage({ 'action': 'getPIDValue' });
            } else if (action == 'returnPIDValue') {
                // 取得PIDValue後換成PID
                g_connectedDevicePID = getPIDFromPIDValue(data.value);
                console.log('connected device: ' + g_connectedDevicePID);
                // 確認連接的chip是否為現在畫面上呈現的chip
                if (g_partNumber_package.indexOf(g_connectedDevicePID) != -1) {
                    // 紀錄各個register的預設位址
                    var addrs = [];
                    var regNames = [];
                    regNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_description);
                    for (i = 0; i < regNames.length; i++) {
                        addrs.push(NUTOOL_CLOCK.g_register_map_description[regNames[i]]);
                    }
                    // 將預設位址送到worker讀值
                    g_worker.postMessage({ 'action': 'getMFPValues', 'data': addrs });
                } else {
                    // 流程結束，斷開連結
                    g_worker.postMessage({ 'action': 'connectComplete' });
                    // 提示使用者選擇正確的型號
                    decideUIlanguage();
                    showAlertDialog("请切换至与连接芯片相符合的芯片系列与型号。",
                        "請切換至與連接晶片相符合的晶片系列與型號。",
                        `Please switch to the Chip Series and Part No. that matches the connected chip.`);
                }
            } else if (action == 'returnRegisterValue') {
                console.log('returnRegisterValue');
                if (data.type == 'CortexM') {
                    var regs = [];
                    regNames = getPropertyNames(NUTOOL_CLOCK.g_register_map_description);
                    for (var m in data.result) {
                        for (n = 0; n < regNames.length; n++) {
                            if (NUTOOL_CLOCK.g_register_map_description[regNames[n]] == Object.keys(data.result[m])[0]) {
                                regs.push(`Reg:${regNames[n]} = 0x${data.result[m][Object.keys(data.result[m])[0]]}\r\n`);
                                break;
                            }
                        }
                    }
                    // 使用load file的flow來呈現讀到的資訊，所以要做一個和config file一樣的text，目前先固定回到step 1
                    var text = `MCU:${g_partNumber_package}\r\n`;
                    for (var i = 0; i < regs.length; i++) {
                        text = text + regs[i];
                    }
                    // TODO: 由於PLL要自己從register value值回推，等確認完再把step移到3或4
                    // if (typeof NUTOOL_CLOCK.g_register_map['PLLCON'.toEquivalent()] !== 'undefined') {
                    //     text = text + `Step:4\r\n`;
                    // } else {
                    //     text = text + `Step:3\r\n`;
                    // }
                    text = text + `Step:1\r\n`;
                    // 執行loadConfig_core()
                    NUTOOL_CLOCK.g_readConfigFileContentText = text;
                    NUTOOL_CLOCK.g_readConfigFilePath = 'dummyPath';
                    loadConfig_core();
                    // TODO: 等到PLL功能可以正常執行後，記得修改Alert message
                    showAlertDialog("请手动填入CLOCK频率。",
                        "請手動填入CLOCK頻率",
                        "Please manually fill in the CLOCK frequencies.");
                } else if (data.type == '8051') {
                    // TODO: (Clock尚未支援8051)
                } else {
                    console.log("returnRegisterValue: unknown type.");
                }
            } else if (action == 'disconnect') {
                console.log("webusb disconnected");
                g_deviceConnected = false;
            }
        };
    }

    function getPIDFromPIDValue(PIDValue) {
        var PIDLine = g_completePIDList.filter(line => {
            return line.indexOf(PIDValue) != -1;
        });
        return PIDLine[0].slicePriorToX('-');
    }

    function isElectron() {
        // Renderer process
        if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
            return true;
        }

        // Main process
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
            return true;
        }

        // Detect the user agent when the `nodeIntegration` option is set to false
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }

        return false;
    }

    function parsingPartNumID() {
        return;
        var PartNumID = $.ajax({ url: 'PartNumID.cpp', async: false }).responseText;
        PartNumID.split(/\r\n|\n/).filter(function (line) {
            var reg = new RegExp('.*[^\/]\{.*0x.*[PROJ].*\}');
            return reg.test(line);
        }).forEach(function (line) { // 根據PartNumID的格式放在PIDPair後存入PIDList
            if (line.indexOf('not release') == -1) {
                // TODO: 有點硬拆，需要轉換成json再來parse
                let pid = line.substring(line.indexOf('"') + 1, line.lastIndexOf('"'));
                let regValue = line.substring(line.indexOf('0x'), line.lastIndexOf('PROJ') - 2);
                let projName = line.substring(line.indexOf('PROJ'), line.lastIndexOf('}'));
                g_completePIDList.push(pid + '-' + regValue + '-' + projName);
            }
        });
    }
    ///////////////////////////////////////////////////////////public API/////////////////////////////////////////////////////////////
    NUTOOL_CLOCK = {
        getg_chipType: function () {
            return g_chipType;
        },
        getg_partNumber_package: function () {
            return g_partNumber_package;
        },
        getg_clockRegsString: function () {
            return g_clockRegsString;
        },
        getg_clockRegsString1: function () {
            return g_clockRegsString1;
        },
        getg_clockRegsString2: function () {
            return g_clockRegsString2;
        },
        getg_userSelectUIlanguage: function () {
            return g_userSelectUIlanguage;
        },
        getg_svgGroup: function () {
            return g_svgGroup;
        },
        getg_clockRegs: function () {
            return g_clockRegs;
        },
        getg_realClocks: function () {
            return {
                g_realLIRCoutputClock,
                g_realHIRCoutputClock,
                g_realHIRC2outputClock,
                g_realHIRC48outputClock,
                g_realMIRCoutputClock,
                g_realMIRC1P2MoutputClock,
                g_realRTC32koutputClock,
                g_realLXToutputClock,
                g_realHXToutputClock,
                g_realPLLoutputClock,
                g_realPLL2outputClock,
                g_realPLL480MoutputClock,
                g_realAPLLoutputClock,
                g_realPLLFNoutputClock,
                g_realHSUSBOTGPHYoutputClock,
                g_realHCLKoutputClock,
                g_realPCLKoutputClock,
                g_realPCLK0outputClock,
                g_realPCLK1outputClock,
                g_realPCLK2outputClock
            };
        },
        ////for functional test////
        isFieldBe1: isFieldBe1,
        isEnabled: isEnabled,
        initializationByTest: initializationByTest,
        reportBaseClockFrequencies: reportBaseClockFrequencies,
        doubleClickD3Node: doubleClickD3Node,
        dragD3Node: dragD3Node,
        clickModuleCanvas: clickModuleCanvas,
        changeDividerDialogInput: changeDividerDialogInput,
        retrieveNodeTooltip: retrieveNodeTooltip,
        retrieveGenerateCodeContent: retrieveGenerateCodeContent,
        checkD3NodeFrequency: checkD3NodeFrequency,
        decideNewChipType: decideNewChipType,
        readValueFromClockRegs: readValueFromClockRegs,
        uncheckAllNodes_core: uncheckAllNodes_core,
        ////for CodeGenerator////
        setg_selectedPartNoValue: function (newPartNoValue) {
            g_selectedPartNoValue = newPartNoValue;
        },
        loadClockConfigureTool: loadClockConfigureTool,
        getGeneratedClockStatus: getGeneratedClockStatus,
        concatenate_generated_code_begin: concatenate_generated_code_begin,
        receiveMessageFromPythonApp: receiveMessageFromPythonApp,
        synchronizeWithTargetPartNumber: synchronizeWithTargetPartNumber,
        ////strategy pattern////
        getPropertyNames: getPropertyNames,
        hasBusClockOrNot: hasBusClockOrNot,
        hasEngineClockOrNot: hasEngineClockOrNot,
        findBusClock: findBusClock,
        decimalToHex: decimalToHex,
        /////////////////////////////////////////////////////////////////////////////////////
        showLeftPanel: showLeftPanel,
        loadConfig_core: loadConfig_core,
        saveConfig: saveConfig,
        generateCode: generateCode,
        concatenate_g_clockRegsString: concatenate_g_clockRegsString,
        concatenate_generated_code: concatenate_generated_code,
        concatenate_generated_modularizedCode: concatenate_generated_modularizedCode,
        pageRefresh: pageRefresh,
        switchD3ClockTree: switchD3ClockTree,
        zoomIn: zoomIn,
        bestFit: bestFit,
        zoomOut: zoomOut,
        uncheckAllNodes: uncheckAllNodes,
        setLanguage: setLanguage,
        changeUIlanguage: changeUIlanguage,
        executePDFfail: executePDFfail,
        handleEnter: handleEnter,
        redrawForResizingDialog: redrawForResizingDialog,
        recordConfig: recordConfig,
        closeAPP: closeAPP,
        g_readConfigFilePath: "", // for DISPATCH_PROPERTYPUT
        g_readConfigFileContentText: "",
        g_clockFunctionString: "" // for DISPATCH_PROPERTYPUT
    };
}(NUTOOL_CLOCK, this));
