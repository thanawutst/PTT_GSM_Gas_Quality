﻿using System;
using System.Collections.Generic;

#nullable disable

namespace PTT_GSM_CSC_Factory.Models.FactoryDB
{
    public partial class TM_DataType
    {
        public int nTypeID { get; set; }
        public string sTypeNameTH { get; set; }
        public string sTypeNameEN { get; set; }
        public string cActive { get; set; }
        public string cDel { get; set; }
        public int? nOrder { get; set; }
        public string cManage { get; set; }
    }
}
